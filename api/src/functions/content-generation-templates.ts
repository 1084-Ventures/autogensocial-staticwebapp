import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { templateContainer, brandContainer } from "../shared/cosmosClient";
import type { components } from '../../generated/models';

// Use generated types
export type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
export type ContentGenerationTemplateCreate = components["schemas"]["ContentGenerationTemplateCreate"];
export type ContentGenerationTemplateUpdate = components["schemas"]["ContentGenerationTemplateUpdate"];
export type ContentGenerationTemplateResponse = components["schemas"]["ContentGenerationTemplateResponse"];
export type ContentGenerationTemplateGet = components["schemas"]["ContentGenerationTemplateGet"];
export type PaginationParams = components["parameters"]["pagination"];
export type ErrorResponse = components["schemas"]["Error"];
export type Schedule = components["schemas"]["Schedule"];
export type TemplateSettings = components["schemas"]["TemplateSettings"];
export type TemplateInfo = components["schemas"]["TemplateInfo"];
export type BrandDocument = components["schemas"]["BrandDocument"];

import { randomUUID } from 'crypto';


// Cosmos DB clients are now imported from shared/cosmosClient for consistency and best practice.

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Utility to remove obsolete fields from templateSettings
function stripObsoleteFields(templateSettings: any) {
    if (templateSettings) {
        if ('boxText' in templateSettings) delete templateSettings.boxText;
        if ('textBox' in templateSettings) delete templateSettings.textBox;
    }
    return templateSettings;
}

export const contentGenerationTemplatesApiHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    context.log('Request received in content-generation-templates');
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
                const errMsg = (jsonErr instanceof Error) ? jsonErr.message : String(jsonErr);
                context.log('Invalid JSON in request body:', errMsg);
                return createErrorResponse(400, 'Invalid JSON in request body', 'INVALID_JSON');
            }
            context.log('Parsed request body:', JSON.stringify(body));
            try {
                context.log('Parsed request body:', JSON.stringify(body));
            } catch (e) {
                context.log('Parsed request body: [unserializable]');
            }
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
            case 'DELETE':
                const templateId = request.params.id;
                if (!templateId) {
                    return createErrorResponse(400, 'Template ID is required for deletion');
                }
                let deleteBody: any = undefined;
                try {
                    deleteBody = await request.json();
                } catch {}
                const idToDelete = deleteBody?.id || templateId;
                if (!idToDelete) {
                    return createErrorResponse(400, 'Template ID is required for deletion');
                }
                // Find the brandId for the template so we can use it as the partition key
                let brandId: string | undefined;
                try {
                    const { resource } = await getTemplateByIdWithPartition(idToDelete);
                    brandId = resource?.brandId;
                } catch (err) {
                    context.log(`[DELETE] Error fetching template for partition key:`, err);
                }
                if (!brandId) {
                    context.log(`[DELETE] Could not find brandId for template id: ${idToDelete}`);
                    return createErrorResponse(404, 'Template not found or already deleted');
                }
                context.log(`[DELETE] Attempting to delete template. id: ${idToDelete}, partitionKey: ${brandId}`);
                if (request.method === 'DELETE') {
                    try {
                        const response = await templateContainer.item(idToDelete, brandId).delete();
                        // Log only safe properties, never the full object
                        if (response && typeof response.statusCode !== 'undefined') {
                            context.log(`[DELETE] Cosmos DB delete status:`, response.statusCode);
                        }
                        if (!response.resource) {
                            context.log(`[DELETE] No resource returned after delete. Returning 404.`);
                            return createErrorResponse(404, 'Template not found or already deleted');
                        }
                        context.log(`[DELETE] Delete successful for id: ${idToDelete}`);
                        return createResponse(200, { id: idToDelete });
                    } catch (error) {
                        const errMsg = (error instanceof Error) ? error.message : String(error);
                        context.log('[DELETE] Error during delete:', errMsg);
                        return createErrorResponse(500, errMsg || 'Unknown error');
                    }
                }
            default:
                context.log('Unsupported HTTP method:', request.method);
                return createErrorResponse(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
    } catch (error) {
        const errMsg = (error instanceof Error) ? error.message : String(error);
        context.log('Unhandled error in content_generation_template_management:', errMsg);
        context.log('[main] Returning 500 error response');
        return createErrorResponse(500, errMsg || 'Internal Server Error', 'INTERNAL_ERROR');
    }
}

// Helper to fetch template by id using cross-partition query to get brandId
async function getTemplateByIdWithPartition(templateId: string): Promise<{ resource: ContentGenerationTemplateDocument | undefined }> {
    const querySpec = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: templateId }]
    };
    const { resources } = await templateContainer.items.query<ContentGenerationTemplateDocument>(querySpec).fetchAll();
    return { resource: resources[0] };
}

async function handleCreate(request: HttpRequest, userId: string, context: InvocationContext, body: ContentGenerationTemplateCreate): Promise<HttpResponseInit> {
    const start = Date.now();
    const errors: Array<{ field: string; message: string }> = [];
    if (!body.brandId) {
        errors.push({ field: 'brandId', message: 'brandId is required' });
    }
    if (!body.templateInfo) {
        errors.push({ field: 'templateInfo', message: 'templateInfo is required' });
    }
    if (errors.length > 0) {
        context.log('[handleCreate] Validation errors:', JSON.stringify(errors));
        return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', errors);
    }
    context.log('[handleCreate] userId:', userId, 'brandId:', body?.brandId);
    const hasBrandAccess = await verifyBrandOwnership(body.brandId, userId, context);
    context.log('[handleCreate] hasBrandAccess:', hasBrandAccess);
    if (!hasBrandAccess) {
        context.log(`[handleCreate] Elapsed: ${Date.now() - start}ms (authorization failed)`);
        return createErrorResponse(403, 'Not authorized to create templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
    }
    if (body.templateSettings) stripObsoleteFields(body.templateSettings);
    const newTemplate: ContentGenerationTemplateDocument = {
        id: randomUUID(),
        brandId: body.brandId,
        metadata: {
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            isActive: true
        },
        templateInfo: body.templateInfo,
        schedule: body.schedule ?? { daysOfWeek: [], timeSlots: [] },
        templateSettings: body.templateSettings ?? { promptTemplate: {} }
    };
    context.log('[handleCreate] Document to be created:', JSON.stringify(newTemplate));
    let createdTemplate;
    try {
        // Pass the partition key as part of the options object (type assertion to bypass type error)
        const result = await templateContainer.items.create(newTemplate, { partitionKey: newTemplate.brandId } as any);
        createdTemplate = result.resource;
    } catch (err) {
        context.log(`[handleCreate] DB error after ${Date.now() - start}ms`, err);
        return createErrorResponse(500, 'Failed to create template');
    }
    if (!createdTemplate) {
        context.log(`[handleCreate] No resource returned after DB write: ${Date.now() - start}ms`);
        return createErrorResponse(500, 'Failed to create template');
    }
    context.log(`[handleCreate] End: ${Date.now() - start}ms, about to return 201 response`);
    // Use the generated response type
    const resp: ContentGenerationTemplateResponse = {
        id: createdTemplate.id,
        brandId: createdTemplate.brandId
    };
    context.log('[handleCreate] Returning response:', JSON.stringify(resp));
    return createResponse(201, resp);
}

async function verifyBrandOwnership(brandId: string, userId: string, context?: InvocationContext): Promise<boolean> {
    try {
        const query = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [{ name: '@id', value: brandId }]
        };
        const { resources } = await brandContainer.items.query<BrandDocument>(query).fetchAll();
        const brand = resources[0];
        if (context) context.log('[verifyBrandOwnership] brand:', JSON.stringify(brand));
        return brand?.userId === userId;
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
        const hasBrandAccess = await verifyBrandOwnership(brandId, userId, context);
        if (!hasBrandAccess) {
            return createErrorResponse(403, 'Not authorized to view templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
        }
        const pagination = extractPaginationParams(request);
        const templates = await getTemplatesByBrandId(brandId, userId, pagination);
        templates.forEach(t => { if (t.templateSettings) stripObsoleteFields(t.templateSettings); });
        return createResponse(200, templates);
    }
    const template = await getTemplateById(templateId, userId);
    if (!template) {
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    const hasBrandAccess = await verifyBrandOwnership(template.brandId || '', userId, context);
    if (!hasBrandAccess) {
        return createErrorResponse(403, 'Not authorized to view this template', 'UNAUTHORIZED_BRAND_ACCESS');
    }
    if (template.templateSettings) stripObsoleteFields(template.templateSettings);
    return createResponse(200, template);
}

async function handleUpdate(request: HttpRequest, userId: string, context: InvocationContext, body?: ContentGenerationTemplateUpdate): Promise<HttpResponseInit> {
    const start = Date.now();
    const templateId = request.params.id;
    if (!templateId) {
        context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (missing id)`);
        return createErrorResponse(400, 'Template ID is required', 'MISSING_ID');
    }
    let existingTemplate;
    try {
        const { resource } = await getTemplateByIdWithPartition(templateId);
        existingTemplate = resource;
        context.log(`[handleUpdate] After DB read: ${Date.now() - start}ms`);
    } catch (err) {
        context.log(`[handleUpdate] DB read error after ${Date.now() - start}ms`, err);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    if (!existingTemplate) {
        context.log(`[handleUpdate] No resource found after DB read: ${Date.now() - start}ms`);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    const hasBrandAccess = await verifyBrandOwnership(existingTemplate.brandId || '', userId, context);
    context.log('[handleUpdate] hasBrandAccess:', hasBrandAccess);
    if (!hasBrandAccess) {
        context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (authorization failed)`);
        return createErrorResponse(403, 'Not authorized to modify templates for this brand', 'UNAUTHORIZED_BRAND_ACCESS');
    }
    let updateData: ContentGenerationTemplateUpdate;
    if (body) {
        updateData = body;
    } else {
        updateData = await request.json() as ContentGenerationTemplateUpdate;
    }
    // If trying to change brandId, verify ownership of new brand
    if (updateData.brandId && updateData.brandId !== existingTemplate.brandId) {
        const hasNewBrandAccess = await verifyBrandOwnership(updateData.brandId, userId, context);
        if (!hasNewBrandAccess) {
            context.log(`[handleUpdate] Elapsed: ${Date.now() - start}ms (new brand authorization failed)`);
            return createErrorResponse(403, 'Not authorized to move template to specified brand', 'UNAUTHORIZED_BRAND_ACCESS');
        }
    }
    if (updateData.templateSettings) stripObsoleteFields(updateData.templateSettings);
    const updatedTemplate: ContentGenerationTemplateDocument = {
        ...existingTemplate,
        ...updateData,
        metadata: {
            ...existingTemplate.metadata,
            updatedDate: new Date().toISOString()
        },
        templateInfo: updateData.templateInfo ? {
            ...existingTemplate.templateInfo,
            ...updateData.templateInfo
        } : existingTemplate.templateInfo,
        schedule: updateData.schedule ? {
            ...existingTemplate.schedule,
            ...updateData.schedule
        } : (existingTemplate.schedule ?? { daysOfWeek: [], timeSlots: [] }),
        templateSettings: updateData.templateSettings ? {
            ...existingTemplate.templateSettings,
            ...updateData.templateSettings
        } : (existingTemplate.templateSettings ?? {})
    };
    if (updatedTemplate.templateSettings) stripObsoleteFields(updatedTemplate.templateSettings);
    let savedTemplate;
    try {
        const brandId = updatedTemplate.brandId;
        const result = await templateContainer.item(templateId, brandId).replace(updatedTemplate);
        savedTemplate = result.resource;
    } catch (err) {
        context.log(`[handleUpdate] DB write error after ${Date.now() - start}ms`, err);
        return createErrorResponse(500, 'Failed to update template');
    }
    if (!savedTemplate) {
        context.log(`[handleUpdate] No resource returned after DB write: ${Date.now() - start}ms`);
        return createErrorResponse(404, 'Template not found', 'RESOURCE_NOT_FOUND');
    }
    context.log(`[handleUpdate] End: ${Date.now() - start}ms`);
    return createResponse(200, savedTemplate);
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
            WHERE c.brandId = @brandId
            ORDER BY c.${sortBy} ${sortOrder}
            OFFSET @offset LIMIT @limit
        `,
        parameters: [
            { name: '@brandId', value: brandId || '' },
            { name: '@offset', value: offset || 0 },
            { name: '@limit', value: limit || DEFAULT_PAGE_SIZE }
        ]
    };
    const { resources: templates } = await templateContainer.items.query<ContentGenerationTemplateDocument>(querySpec).fetchAll();
    return templates;
}

async function getTemplateById(templateId: string, userId: string): Promise<ContentGenerationTemplateDocument | undefined> {
    const { resource } = await getTemplateByIdWithPartition(templateId);
    return resource;
}

async function updateTemplate(templateId: string, userId: string, updateData: ContentGenerationTemplateUpdate): Promise<ContentGenerationTemplateDocument | undefined> {
    const { resource: existingTemplate } = await getTemplateByIdWithPartition(templateId);
    if (!existingTemplate) {
        return undefined;
    }
    const updatedTemplate: ContentGenerationTemplateDocument = {
        ...existingTemplate,
        ...updateData,
        metadata: {
            ...existingTemplate.metadata,
            updatedDate: new Date().toISOString()
        },
        templateInfo: updateData.templateInfo ? {
            ...existingTemplate.templateInfo,
            ...updateData.templateInfo
        } : existingTemplate.templateInfo,
        schedule: updateData.schedule ? {
            ...existingTemplate.schedule,
            ...updateData.schedule
        } : (existingTemplate.schedule ?? { daysOfWeek: [], timeSlots: [] }),
        templateSettings: updateData.templateSettings ? {
            ...existingTemplate.templateSettings,
            ...updateData.templateSettings
        } : (existingTemplate.templateSettings ?? {})
    };
    if (updatedTemplate.templateSettings) stripObsoleteFields(updatedTemplate.templateSettings);
    const brandId = updatedTemplate.brandId;
    const { resource: savedTemplate } = await templateContainer.item(templateId, brandId).replace(updatedTemplate);
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
    let detailsString: string | null = null;
    if (details && details.length > 0) {
        detailsString = details.map(d => `${d.field}: ${d.message}`).join('; ');
    }
    const error: ErrorResponse = {
        code: code || 'ERROR',
        message,
        ...(detailsString !== null ? { details: detailsString } : {})
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

app.http('content-generation-templates', {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    authLevel: 'anonymous',
    route: 'content-generation-templates/{id?}',
    handler: contentGenerationTemplatesApiHandler
});

// All property names and structures now match the OpenAPI-generated types. All custom validation and legacy property access has been removed.
