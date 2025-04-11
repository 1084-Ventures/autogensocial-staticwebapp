import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { 
    ContentGenerationTemplateDocument, 
    ContentTemplateCreate, 
    ContentTemplateUpdate,
    validateTemplateInfo,
    validateSchedule,
    validateTemplateSettings
} from '../models/content_generation_template.model';
import { ErrorResponse, PaginationParams } from '../models/base.model';
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER_TEMPLATE || '');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function content_generation_template_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = await extractUserId(request);
        if (!userId || userId === 'anonymous') {
            return createErrorResponse(401, 'Authentication required');
        }

        switch (request.method) {
            case 'POST':
                return handleCreate(request, userId);
            case 'GET':
                return handleGet(request, userId);
            case 'PUT':
                return handleUpdate(request, userId);
            default:
                return createErrorResponse(405, 'Method not allowed');
        }
    } catch (error) {
        context.log("Error:", error);
        return createErrorResponse(500, 'Internal Server Error', 'INTERNAL_ERROR');
    }
}

async function handleCreate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const body = await request.json() as ContentTemplateCreate;
    
    // Validate input
    const validationErrors: Array<{ field: string; message: string }> = [];
    
    const templateInfoValidation = validateTemplateInfo(body.templateInfo);
    if (!templateInfoValidation.isValid) {
        validationErrors.push(...templateInfoValidation.errors.map(error => ({
            field: 'templateInfo',
            message: error
        })));
    }

    const scheduleValidation = validateSchedule(body.schedule);
    if (!scheduleValidation.isValid) {
        validationErrors.push(...scheduleValidation.errors.map(error => ({
            field: 'schedule',
            message: error
        })));
    }

    const settingsValidation = validateTemplateSettings(body.settings);
    if (!settingsValidation.isValid) {
        validationErrors.push(...settingsValidation.errors.map(error => ({
            field: 'settings',
            message: error
        })));
    }

    if (validationErrors.length > 0) {
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
    }

    const newTemplate: ContentGenerationTemplateDocument = {
        id: randomUUID(),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            version: 1
        },
        templateInfo: body.templateInfo,
        schedule: body.schedule,
        settings: body.settings
    };

    const { resource: createdTemplate } = await container.items.create(newTemplate);
    if (!createdTemplate) {
        return createErrorResponse(500, 'Failed to create template');
    }
    return createResponse(201, { 
        id: createdTemplate.id, 
        name: createdTemplate.templateInfo.name 
    });
}

async function handleGet(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const templateId = request.params.id;

    if (!templateId) {
        const pagination = extractPaginationParams(request);
        const templates = await getTemplatesByBrandId(request.query.get('brandId'), userId, pagination);
        return createResponse(200, templates);
    }

    const template = await getTemplateById(templateId, userId);
    if (!template) {
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    return createResponse(200, template);
}

async function handleUpdate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const templateId = request.params.id;
    if (!templateId) {
        return createErrorResponse(400, 'Template ID is required', 'MISSING_ID');
    }

    const { resource: existingTemplate } = await container.item(templateId, templateId).read<ContentGenerationTemplateDocument>();
    if (!existingTemplate) {
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }

    const updateData = await request.json() as ContentTemplateUpdate;
    const validationErrors: Array<{ field: string; message: string }> = [];

    if (updateData.templateInfo) {
        const templateInfoToValidate = {
            ...existingTemplate.templateInfo,
            ...updateData.templateInfo
        };
        const templateInfoValidation = validateTemplateInfo(templateInfoToValidate);
        if (!templateInfoValidation.isValid) {
            validationErrors.push(...templateInfoValidation.errors.map(error => ({
                field: 'templateInfo',
                message: error
            })));
        }
    }

    if (updateData.schedule) {
        const scheduleToValidate = {
            ...existingTemplate.schedule,
            ...updateData.schedule
        };
        const scheduleValidation = validateSchedule(scheduleToValidate);
        if (!scheduleValidation.isValid) {
            validationErrors.push(...scheduleValidation.errors.map(error => ({
                field: 'schedule',
                message: error
            })));
        }
    }

    if (updateData.settings) {
        const settingsToValidate = {
            ...existingTemplate.settings,
            promptTemplate: {
                ...existingTemplate.settings.promptTemplate,
                ...updateData.settings.promptTemplate
            },
            visualStyle: {
                ...existingTemplate.settings.visualStyle,
                ...updateData.settings.visualStyle
            },
            contentStrategy: {
                ...existingTemplate.settings.contentStrategy,
                ...updateData.settings.contentStrategy
            },
            platformSpecific: {
                ...existingTemplate.settings.platformSpecific,
                ...updateData.settings.platformSpecific
            }
        };
        const settingsValidation = validateTemplateSettings(settingsToValidate);
        if (!settingsValidation.isValid) {
            validationErrors.push(...settingsValidation.errors.map(error => ({
                field: 'settings',
                message: error
            })));
        }
    }

    if (validationErrors.length > 0) {
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
    }

    const updatedTemplate = await updateTemplate(templateId, userId, updateData);
    if (!updatedTemplate) {
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }

    return createResponse(200, updatedTemplate);
}

function extractPaginationParams(request: HttpRequest): PaginationParams {
    const searchParams = new URL(request.url).searchParams;
    return {
        limit: Math.min(parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString(), 10), MAX_PAGE_SIZE),
        offset: Math.max(parseInt(searchParams.get('offset') || '0', 10), 0),
        sortBy: (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'name',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    };
}

async function getTemplatesByBrandId(brandId: string | null, userId: string, pagination: PaginationParams): Promise<ContentGenerationTemplateDocument[]> {
    const { limit, offset, sortBy, sortOrder } = pagination;
    
    const querySpec = {
        query: `
            SELECT * FROM c 
            WHERE c.templateInfo.brandId = @brandId
            ORDER BY c.${sortBy} ${sortOrder}
            OFFSET @offset LIMIT @limit
        `,
        parameters: [
            { name: '@brandId', value: brandId || '' },
            { name: '@offset', value: offset || 0 },
            { name: '@limit', value: limit || DEFAULT_PAGE_SIZE }
        ]
    };

    const { resources: templates } = await container.items.query<ContentGenerationTemplateDocument>(querySpec).fetchAll();
    return templates;
}

async function getTemplateById(templateId: string, userId: string): Promise<ContentGenerationTemplateDocument | undefined> {
    const { resource: template } = await container.item(templateId, templateId).read<ContentGenerationTemplateDocument>();
    if (!template) {
        return undefined;
    }
    return template;
}

async function updateTemplate(templateId: string, userId: string, updateData: ContentTemplateUpdate): Promise<ContentGenerationTemplateDocument | undefined> {
    const { resource: existingTemplate } = await container.item(templateId, templateId).read<ContentGenerationTemplateDocument>();
    
    if (!existingTemplate) {
        return undefined;
    }

    const updatedTemplate: ContentGenerationTemplateDocument = {
        ...existingTemplate,
        metadata: {
            ...existingTemplate.metadata,
            updatedAt: new Date().toISOString(),
            version: (existingTemplate.metadata.version || 1) + 1
        },
        templateInfo: updateData.templateInfo ? {
            ...existingTemplate.templateInfo,
            ...updateData.templateInfo
        } : existingTemplate.templateInfo,
        schedule: updateData.schedule ? {
            ...existingTemplate.schedule,
            ...updateData.schedule
        } : existingTemplate.schedule,
        settings: updateData.settings ? {
            promptTemplate: {
                ...existingTemplate.settings.promptTemplate,
                ...updateData.settings.promptTemplate,
                systemPrompt: updateData.settings.promptTemplate?.systemPrompt || existingTemplate.settings.promptTemplate.systemPrompt
            },
            visualStyle: {
                ...existingTemplate.settings.visualStyle,
                ...updateData.settings.visualStyle
            },
            contentStrategy: {
                ...existingTemplate.settings.contentStrategy,
                ...updateData.settings.contentStrategy
            }
        } : existingTemplate.settings
    };

    const { resource: savedTemplate } = await container.item(templateId, templateId).replace(updatedTemplate);
    return savedTemplate;
}

function createResponse(status: number, body: any): HttpResponseInit {
    return {
        status,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

function createErrorResponse(
    status: number,
    message: string,
    code?: string,
    details?: Array<{ field: string; message: string }>
): HttpResponseInit {
    const error: ErrorResponse = {
        error: message,
        ...(code && { code }),
        ...(details && { details })
    };
    return createResponse(status, error);
}

async function extractUserId(request: HttpRequest): Promise<string> {
    const clientPrincipal = request.headers.get('x-ms-client-principal');
    if (!clientPrincipal) return 'anonymous';

    try {
        const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
        const principalObject = JSON.parse(decodedPrincipal);
        return principalObject.userId || 'anonymous';
    } catch (error) {
        return 'anonymous';
    }
}

app.http('content_generation_template_management', {
    methods: ['GET', 'POST', 'PUT'],
    authLevel: 'anonymous', // Using Static Web Apps authentication
    route: 'content_generation_template_management/{id?}',
    handler: content_generation_template_management
});
