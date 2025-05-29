import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { 
    ContentGenerationTemplateDocument, 
    ContentTemplateCreate, 
    ContentTemplateUpdate,
    validateTemplateInfo,
    validateSchedule,
    validateTemplateSettings,
    TemplateSettings,
    Schedule
} from '../models/content_generation_template.model';
import { ErrorResponse, PaginationParams } from '../models/base.model';
import { BrandDocument } from '../models/brand.model';
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER_TEMPLATE || '');
const brandContainer = database.container(process.env.COSMOS_DB_CONTAINER_BRAND || '');

// Startup diagnostics
try {
    const cosmosPkg = require('@azure/cosmos/package.json');
    // eslint-disable-next-line no-console
    console.log('[Startup] Cosmos DB SDK version:', cosmosPkg.version);
} catch (e) {
    // eslint-disable-next-line no-console
    console.log('[Startup] Could not determine Cosmos DB SDK version:', e);
}
// eslint-disable-next-line no-console
console.log('[Startup] COSMOS_DB_CONNECTION_STRING present:', !!process.env.COSMOS_DB_CONNECTION_STRING);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function content_generation_template_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Request received in content_generation_template_management');
    try {
        const userId = await extractUserId(request);
        if (!userId || userId === 'anonymous') {
            context.log('User not authenticated');
            return createErrorResponse(401, 'User not authenticated', 'UNAUTHENTICATED');
        }
        let body: any = undefined;
        if (request.method === 'POST' || request.method === 'PUT') {
            try {
                body = await request.json();
            } catch (jsonErr) {
                context.log('Invalid JSON in request body', jsonErr);
                return createErrorResponse(400, 'Invalid JSON in request body', 'INVALID_JSON');
            }
            context.log('Parsed request body:', JSON.stringify(body));
        }
        switch (request.method) {
            case 'POST':
                context.log('[main] Dispatching to handleCreate');
                const postResp = await handleCreate(request, userId, context, body);
                context.log('[main] handleCreate returned, about to return response');
                return postResp;
            case 'GET':
                return handleGet(request, userId, context);
            case 'PUT':
                return handleUpdate(request, userId, context, body);
            default:
                context.log('Unsupported HTTP method:', request.method);
                return createErrorResponse(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
    } catch (error) {
        context.log('Unhandled error in content_generation_template_management:', error);
        if (error instanceof Error) {
            context.log('[main] Returning 500 error response');
            return createErrorResponse(500, error.message, 'INTERNAL_ERROR');
        }
        context.log('[main] Returning generic 500 error response');
        return createErrorResponse(500, 'Internal Server Error', 'INTERNAL_ERROR');
    }
}

async function handleCreate(request: HttpRequest, userId: string, context: InvocationContext, body: ContentTemplateCreate): Promise<HttpResponseInit> {
    const start = Date.now();
    context.log('[handleCreate] ENV:', {
        COSMOS_DB_CONNECTION_STRING: (process.env.COSMOS_DB_CONNECTION_STRING || '').slice(0, 20) + '...',
        COSMOS_DB_NAME: process.env.COSMOS_DB_NAME,
        COSMOS_DB_CONTAINER_TEMPLATE: process.env.COSMOS_DB_CONTAINER_TEMPLATE,
        COSOS_DB_CONTAINER_BRAND: process.env.COSMOS_DB_CONTAINER_BRAND
    });
    // Early validation for required fields
    const earlyValidationErrors: Array<{ field: string; message: string }> = [];
    if (!body.templateInfo) {
        earlyValidationErrors.push({ field: 'templateInfo', message: 'templateInfo is required' });
    } else if (!body.templateInfo.brandId) {
        earlyValidationErrors.push({ field: 'templateInfo.brandId', message: 'brandId is required' });
    }
    if (earlyValidationErrors.length > 0) {
        context.log('[handleCreate] Early validation errors:', JSON.stringify(earlyValidationErrors));
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', earlyValidationErrors);
    }
    context.log('[handleCreate] userId:', userId, 'brandId:', body?.templateInfo?.brandId);
    context.log('[handleCreate] Awaiting verifyBrandOwnership...');
    const hasBrandAccess = await verifyBrandOwnership(body.templateInfo.brandId, userId, context);
    context.log('[handleCreate] hasBrandAccess:', hasBrandAccess);
    if (!hasBrandAccess) {
        context.log(`[handleCreate] Elapsed: ${Date.now() - start}ms (authorization failed)`);
        return createErrorResponse(403, 'Not authorized to create templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
    }
    // Always run all validation functions and collect all errors
    const validationErrors: Array<{ field: string; message: string }> = [];
    // TemplateInfo validation
    let templateInfoValidation;
    try {
        templateInfoValidation = validateTemplateInfo(body.templateInfo);
        context.log('[handleCreate] templateInfoValidation:', JSON.stringify(templateInfoValidation));
        if (!templateInfoValidation.isValid) {
            validationErrors.push(...templateInfoValidation.errors.map(error => ({
                field: 'templateInfo',
                message: error
            })));
        }
    } catch (err) {
        context.log('[handleCreate] Exception in validateTemplateInfo:', err);
        validationErrors.push({ field: 'templateInfo', message: 'Exception during templateInfo validation' });
    }
    // Schedule validation
    let scheduleValidation;
    try {
        scheduleValidation = validateSchedule(body.schedule as Schedule);
        context.log('[handleCreate] scheduleValidation:', JSON.stringify(scheduleValidation));
        if (!scheduleValidation.isValid) {
            validationErrors.push(...scheduleValidation.errors.map(error => ({
                field: 'schedule',
                message: error
            })));
        }
    } catch (err) {
        context.log('[handleCreate] Exception in validateSchedule:', err);
        validationErrors.push({ field: 'schedule', message: 'Exception during schedule validation' });
    }
    // Settings validation
    let settingsValidation;
    try {
        settingsValidation = validateTemplateSettings(body.settings as TemplateSettings);
        context.log('[handleCreate] settingsValidation:', JSON.stringify(settingsValidation));
        if (!settingsValidation.isValid) {
            validationErrors.push(...settingsValidation.errors.map(error => ({
                field: 'settings',
                message: error
            })));
        }
    } catch (err) {
        context.log('[handleCreate] Exception in validateTemplateSettings:', err);
        validationErrors.push({ field: 'settings', message: 'Exception during settings validation' });
    }
    if (validationErrors.length > 0) {
        context.log(`[handleCreate] Elapsed: ${Date.now() - start}ms (validation failed)`);
        context.log('Validation errors:', JSON.stringify(validationErrors));
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
    }
    context.log(`[handleCreate] Validation passed: ${Date.now() - start}ms`);
    const newTemplate: ContentGenerationTemplateDocument = {
        id: randomUUID(),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            version: 1
        },
        templateInfo: body.templateInfo,
        schedule: body.schedule ?? {},
        settings: body.settings ?? {}
    };
    console.log('[handleCreate] Document to be created:', JSON.stringify(newTemplate));
    let createdTemplate;
    try {
        console.log('[handleCreate] About to call container.items.create...');
        const result = await container.items.create(newTemplate);
        console.log('[handleCreate] container.items.create resolved');
        createdTemplate = result.resource;
        console.log(`[handleCreate] After DB write: ${Date.now() - start}ms`);
        // Avoid circular structure error by only logging the resource
        console.log('[handleCreate] DB write resource:', JSON.stringify(result.resource));
    } catch (err) {
        console.log(`[handleCreate] DB error after ${Date.now() - start}ms`, err);
        return createErrorResponse(500, 'Failed to create template');
    }
    if (!createdTemplate) {
        console.log(`[handleCreate] No resource returned after DB write: ${Date.now() - start}ms`);
        return createErrorResponse(500, 'Failed to create template');
    }
    context.log(`[handleCreate] End: ${Date.now() - start}ms, about to return 201 response`);
    const resp = createResponse(201, { 
        id: createdTemplate.id, 
        name: createdTemplate.templateInfo.name 
    });
    context.log('[handleCreate] Returning response:', JSON.stringify(resp));
    return resp;
}

async function verifyBrandOwnership(brandId: string, userId: string, context?: InvocationContext): Promise<boolean> {
    try {
        const { resource: brand } = await brandContainer.item(brandId, brandId).read<BrandDocument>();
        if (context) context.log('[verifyBrandOwnership] brand:', JSON.stringify(brand));
        return brand?.brandInfo.userId === userId;
    } catch (error) {
        if (context) context.log('[verifyBrandOwnership] error:', error);
        return false;
    }
}

async function handleGet(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
    const templateId = request.params.id;

    if (!templateId) {
        const brandId = request.query.get('brandId');
        if (!brandId) {
            return createErrorResponse(400, 'Brand ID is required', 'MISSING_BRAND_ID');
        }

        // Verify brand ownership for listing templates
        const hasBrandAccess = await verifyBrandOwnership(brandId, userId, context);
        if (!hasBrandAccess) {
            return createErrorResponse(403, 'Not authorized to view templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
        }

        const pagination = extractPaginationParams(request);
        const templates = await getTemplatesByBrandId(brandId, userId, pagination);
        return createResponse(200, templates);
    }

    const template = await getTemplateById(templateId, userId);
    if (!template) {
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }

    // Verify brand ownership for getting single template
    const hasBrandAccess = await verifyBrandOwnership(template.templateInfo.brandId, userId, context);
    if (!hasBrandAccess) {
        return createErrorResponse(403, 'Not authorized to view this template', 'UNAUTHORIZED_BRAND_ACCESS');
    }

    return createResponse(200, template);
}

async function handleUpdate(request: HttpRequest, userId: string, context: InvocationContext, body?: ContentTemplateUpdate): Promise<HttpResponseInit> {
    const start = Date.now();
    const templateId = request.params.id;
    if (!templateId) {
        context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (missing id)`);
        return createErrorResponse(400, 'Template ID is required', 'MISSING_ID');
    }
    let existingTemplate;
    try {
        const result = await container.item(templateId, templateId).read<ContentGenerationTemplateDocument>();
        existingTemplate = result.resource;
        context.log(`[handleUpdate] After DB read: ${Date.now() - start}ms`);
    } catch (err) {
        context.log(`[handleUpdate] DB read error after ${Date.now() - start}ms`, err);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    if (!existingTemplate) {
        context.log(`[handleUpdate] No resource found after DB read: ${Date.now() - start}ms`);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    // Verify brand ownership
    const hasBrandAccess = await verifyBrandOwnership(existingTemplate.templateInfo.brandId, userId, context);
    context.log('[handleUpdate] hasBrandAccess:', hasBrandAccess);
    if (!hasBrandAccess) {
        context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (authorization failed)`);
        return createErrorResponse(403, 'Not authorized to modify templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
    }
    let updateData: ContentTemplateUpdate;
    if (body) {
        updateData = body;
    } else {
        updateData = await request.json() as ContentTemplateUpdate;
    }
    // If trying to change brandId, verify ownership of new brand
    if (updateData.templateInfo?.brandId && updateData.templateInfo.brandId !== existingTemplate.templateInfo.brandId) {
        const hasNewBrandAccess = await verifyBrandOwnership(updateData.templateInfo.brandId, userId, context);
        if (!hasNewBrandAccess) {
            context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (new brand authorization failed)`);
            return createErrorResponse(403, 'Not authorized to move template to specified brand', 'UNAUTHORIZED_BRAND_ACCESS');
        }
    }
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
        // Ensure required fields are present for validation
        const validSchedule: Schedule = {
            daysOfWeek: scheduleToValidate.daysOfWeek || [],
            timeSlots: scheduleToValidate.timeSlots || []
        };
        const scheduleValidation = validateSchedule(validSchedule);
        if (!scheduleValidation.isValid) {
            validationErrors.push(...scheduleValidation.errors.map(error => ({
                field: 'schedule',
                message: error
            })));
        }
    }
    if (updateData.settings) {
        const safeSettings = (existingTemplate.settings && typeof existingTemplate.settings === 'object' && 'promptTemplate' in existingTemplate.settings) ? existingTemplate.settings as TemplateSettings : undefined;
        if (updateData.settings.promptTemplate) {
            const promptTemplateToValidate = {
                ...(safeSettings?.promptTemplate || {}),
                ...updateData.settings.promptTemplate
            };
            const promptTemplateValidation = validateTemplateSettings({
                ...(safeSettings || {}),
                promptTemplate: promptTemplateToValidate
            } as TemplateSettings);
            if (!promptTemplateValidation.isValid) {
                validationErrors.push(...promptTemplateValidation.errors.map(error => ({
                    field: 'settings.promptTemplate',
                    message: error
                })));
            }
        }
        if (updateData.settings.visualStyle) {
            const visualStyleToValidate = {
                ...(safeSettings?.visualStyle || {}),
                ...updateData.settings.visualStyle
            };
            const visualStyleValidation = validateTemplateSettings({
                ...(safeSettings || {}),
                visualStyle: visualStyleToValidate
            } as TemplateSettings);
            if (!visualStyleValidation.isValid) {
                validationErrors.push(...visualStyleValidation.errors.map(error => ({
                    field: 'settings.visualStyle',
                    message: error
                })));
            }
        }
        if ('image' in updateData.settings && updateData.settings.image) {
            // Optionally add image validation here if needed
            // For now, just check presence
            const imageValidation = validateTemplateSettings({
                ...(safeSettings || {}),
                image: updateData.settings.image
            } as TemplateSettings);
            if (!imageValidation.isValid) {
                validationErrors.push(...imageValidation.errors.map(error => ({
                    field: 'settings.image',
                    message: error
                })));
            }
        }
    }
    if (validationErrors.length > 0) {
        context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (validation failed)`);
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
    }
    context.log(`[handleUpdate] After validation: ${Date.now() - start}ms`);
    let updatedTemplate;
    try {
        updatedTemplate = await updateTemplate(templateId, userId, updateData);
        context.log(`[handleUpdate] After DB write: ${Date.now() - start}ms`);
    } catch (err) {
        context.log(`[handleUpdate] DB write error after ${Date.now() - start}ms`, err);
        return createErrorResponse(500, 'Failed to update template');
    }
    if (!updatedTemplate) {
        context.log(`[handleUpdate] No resource returned after DB write: ${Date.now() - start}ms`);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    context.log(`[handleUpdate] End: ${Date.now() - start}ms`);
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
    function isTemplateSettings(obj: any): obj is TemplateSettings {
        return obj && typeof obj === 'object' && 'promptTemplate' in obj && 'visualStyle' in obj;
    }
    function isSchedule(obj: any): obj is Schedule {
        return obj && typeof obj === 'object' && 'daysOfWeek' in obj && 'timeSlots' in obj;
    }
    const safeSettings = isTemplateSettings(existingTemplate.settings) ? existingTemplate.settings : undefined;
    const safeSchedule = isSchedule(existingTemplate.schedule) ? existingTemplate.schedule : undefined;
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
            ...(safeSchedule || {}),
            ...updateData.schedule
        } : (existingTemplate.schedule ?? {}),
        settings: updateData.settings ? {
            ...(safeSettings || {}),
            promptTemplate: {
                ...(safeSettings && 'promptTemplate' in safeSettings ? (safeSettings as any).promptTemplate : {}),
                ...updateData.settings.promptTemplate,
                systemPrompt: updateData.settings.promptTemplate?.systemPrompt || (safeSettings && 'promptTemplate' in safeSettings ? (safeSettings as any).promptTemplate?.systemPrompt : undefined)
            },
            visualStyle: {
                ...(safeSettings && 'visualStyle' in safeSettings ? (safeSettings as any).visualStyle : {}),
                ...updateData.settings.visualStyle
            }
        } : (existingTemplate.settings ?? {})
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
