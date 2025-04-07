import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { ContentGenerationTemplate, ContentTemplateCreate, ContentTemplateUpdate } from '../models/content_generation_template.model';
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER_TEMPLATE || '');

export async function content_generation_template_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = await extractUserId(request);

        switch (request.method) {
            case 'POST':
                return await handleCreate(request, userId);
            case 'GET':
                return await handleGet(request, userId);
            case 'PUT':
                return await handleUpdate(request, userId);
            default:
                return { status: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
        }
    } catch (error) {
        context.log('Error:', error);
        return { status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
}

async function handleCreate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const body = await request.json() as ContentTemplateCreate;
    
    const brandExists = await verifyBrandOwnership(body.brandId, userId);
    if (!brandExists) {
        return { status: 403, body: JSON.stringify({ error: 'Not authorized to create templates for this brand' }) };
    }

    const template: ContentGenerationTemplate = {
        id: randomUUID(),
        metadata: {
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            isActive: true
        },
        name: body.name,
        description: body.description,
        brandId: body.brandId,
        contentType: body.contentType,
        schedule: body.schedule,
        settings: {
            promptTemplate: {
                systemPrompt: body.settings.promptTemplate.systemPrompt,
                userPrompt: body.settings.promptTemplate.userPrompt,
                temperature: body.settings.promptTemplate.temperature,
                maxTokens: body.settings.promptTemplate.maxTokens,
                model: body.settings.promptTemplate.model,
                variables: body.settings.promptTemplate.variables
            },
            visualStyle: body.settings.visualStyle,
            contentStrategy: {
                targetAudience: body.settings.contentStrategy?.targetAudience,
                tone: body.settings.contentStrategy?.tone,
                keywords: body.settings.contentStrategy?.keywords,
                hashtagStrategy: body.settings.contentStrategy?.hashtagStrategy,
                callToAction: body.settings.contentStrategy?.callToAction
            },
            platformSpecific: body.settings.platformSpecific
        }
    };

    const { resource: created } = await container.items.create(template);
    return { status: 201, body: JSON.stringify(created) };
}

async function handleGet(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const templateId = request.params.id;
    const brandId = request.query.get('brandId');

    if (templateId) {
        const template = await getTemplateById(templateId, userId);
        return template 
            ? { status: 200, body: JSON.stringify(template) }
            : { status: 404, body: JSON.stringify({ error: 'Template not found' }) };
    }

    if (brandId) {
        const templates = await getTemplatesByBrandId(brandId, userId);
        return { status: 200, body: JSON.stringify(templates) };
    }

    return { status: 400, body: JSON.stringify({ error: 'Brand ID is required' }) };
}

async function handleUpdate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
    const templateId = request.params.id;
    if (!templateId) {
        return { status: 400, body: JSON.stringify({ error: 'Template ID is required' }) };
    }

    const updateData = await request.json() as ContentTemplateUpdate;
    const updatedTemplate = await updateTemplate(templateId, userId, updateData);

    return updatedTemplate
        ? { status: 200, body: JSON.stringify(updatedTemplate) }
        : { status: 404, body: JSON.stringify({ error: 'Template not found' }) };
}

async function verifyBrandOwnership(brandId: string, userId: string): Promise<boolean> {
    const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @brandId AND c.brandInfo.userId = @userId',
        parameters: [
            { name: '@brandId', value: brandId },
            { name: '@userId', value: userId }
        ]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.length > 0;
}

async function getTemplateById(templateId: string, userId: string): Promise<ContentGenerationTemplate | null> {
    const { resource: template } = await container.item(templateId, templateId).read<ContentGenerationTemplate>();
    if (!template || !await verifyBrandOwnership(template.brandId, userId)) {
        return null;
    }
    return template;
}

async function getTemplatesByBrandId(brandId: string, userId: string): Promise<ContentGenerationTemplate[]> {
    if (!await verifyBrandOwnership(brandId, userId)) {
        return [];
    }

    const querySpec = {
        query: 'SELECT * FROM c WHERE c.brandId = @brandId',
        parameters: [{ name: '@brandId', value: brandId }]
    };
    const { resources } = await container.items.query<ContentGenerationTemplate>(querySpec).fetchAll();
    return resources;
}

async function updateTemplate(templateId: string, userId: string, updateData: ContentTemplateUpdate): Promise<ContentGenerationTemplate | null> {
    const template = await getTemplateById(templateId, userId);
    if (!template) return null;

    const updatedTemplate: ContentGenerationTemplate = {
        ...template,
        name: updateData.name ?? template.name,
        description: updateData.description ?? template.description,
        contentType: updateData.contentType ?? template.contentType,
        schedule: updateData.schedule ? {
            ...template.schedule,
            ...updateData.schedule
        } : template.schedule,
        settings: {
            ...template.settings,
            ...(updateData.settings && {
                promptTemplate: updateData.settings.promptTemplate ? {
                    ...template.settings.promptTemplate,
                    ...updateData.settings.promptTemplate
                } : template.settings.promptTemplate,
                visualStyle: updateData.settings.visualStyle ? {
                    ...template.settings.visualStyle,
                    ...updateData.settings.visualStyle
                } : template.settings.visualStyle,
                contentStrategy: updateData.settings.contentStrategy ? {
                    ...template.settings.contentStrategy,
                    ...updateData.settings.contentStrategy
                } : template.settings.contentStrategy,
                platformSpecific: updateData.settings.platformSpecific ? {
                    ...template.settings.platformSpecific,
                    ...updateData.settings.platformSpecific
                } : template.settings.platformSpecific
            })
        },
        metadata: {
            ...template.metadata,
            updatedDate: new Date().toISOString()
        }
    };

    const { resource: saved } = await container.item(templateId, templateId).replace(updatedTemplate);
    return saved ?? null;
}

async function extractUserId(request: HttpRequest): Promise<string> {
    const clientPrincipal = request.headers.get('x-ms-client-principal');
    if (!clientPrincipal) return 'anonymous';

    const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
    const principalObject = JSON.parse(decodedPrincipal);
    return principalObject.userId || 'anonymous';
}

app.http('content_generation_template_management', {
    methods: ['GET', 'POST', 'PUT'],
    authLevel: 'anonymous',
    route: 'content_generation_template_management/{id?}',
    handler: content_generation_template_management
});
