import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import type { components } from '../../generated/models';

// Use generated types
export type BrandDocument = components["schemas"]["BrandDocument"];
export type BrandCreate = components["schemas"]["BrandCreate"];
export type BrandUpdate = components["schemas"]["BrandUpdate"];
export type BrandResponse = components["schemas"]["BrandResponse"];
export type PaginationParams = components["parameters"]["pagination"];
export type ErrorResponse = components["schemas"]["Error"];
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER_BRAND || '');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const brandManagement = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
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
      case 'DELETE':
        return handleDelete(request, userId);
      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    context.log("Error:", error);
    return createErrorResponse(500, 'Internal Server Error', 'INTERNAL_ERROR');
  }
}

async function handleCreate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
  const body = await request.json() as BrandCreate;
  // Validate input
  const validationErrors = [];
  if (!body.brandInfo || !body.brandInfo.name || body.brandInfo.name.length < 1 || body.brandInfo.name.length > 100) {
    validationErrors.push({ field: 'brandInfo.name', message: 'Name is required and must be between 1 and 100 characters' });
  }
  if (body.brandInfo && body.brandInfo.description && body.brandInfo.description.length > 500) {
    validationErrors.push({ field: 'brandInfo.description', message: 'Description must not exceed 500 characters' });
  }
  if (validationErrors.length > 0) {
    return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
  }
  const newBrand: BrandDocument = {
    id: randomUUID(),
    userId, // userId at top level
    metadata: {
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      isActive: true
    },
    brandInfo: {
      name: body.brandInfo.name,
      description: body.brandInfo.description || ''
    }
  };
  const { resource: createdBrand } = await container.items.create(newBrand);
  if (!createdBrand) {
    return createErrorResponse(500, 'Failed to create brand');
  }
  const response: BrandResponse = { id: createdBrand.id, name: createdBrand.brandInfo?.name };
  return createResponse(201, response);
}

async function handleGet(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
  const brandId = request.params.id;
  if (!brandId) {
    const pagination = extractPaginationParams(request);
    const brands = await getBrandsByUserId(userId, pagination);
    return createResponse(200, brands as BrandDocument[]);
  }
  const brand = await getBrandById(brandId, userId);
  if (!brand) {
    return createErrorResponse(404, 'Brand not found', 'RESOURCE_NOT_FOUND');
  }
  return createResponse(200, brand as BrandDocument);
}

async function handleUpdate(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
  const brandId = request.params.id;
  if (!brandId) {
    return createErrorResponse(400, 'Brand ID is required', 'MISSING_ID');
  }
  const updateData = await request.json() as BrandUpdate;
  // Validate input
  const validationErrors = [];
  if (updateData.brandInfo && updateData.brandInfo.name && (updateData.brandInfo.name.length < 1 || updateData.brandInfo.name.length > 100)) {
    validationErrors.push({ field: 'brandInfo.name', message: 'Name must be between 1 and 100 characters' });
  }
  if (updateData.brandInfo && updateData.brandInfo.description && updateData.brandInfo.description.length > 500) {
    validationErrors.push({ field: 'brandInfo.description', message: 'Description must not exceed 500 characters' });
  }
  if (validationErrors.length > 0) {
    return createErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR', validationErrors);
  }
  const updatedBrand = await updateBrand(brandId, userId, updateData);
  if (!updatedBrand) {
    return createErrorResponse(404, 'Brand not found', 'RESOURCE_NOT_FOUND');
  }
  return createResponse(200, updatedBrand as BrandDocument);
}

async function handleDelete(request: HttpRequest, userId: string): Promise<HttpResponseInit> {
  let brandId = request.params.id;
  if (!brandId && request.method === 'DELETE') {
    try {
      const body = await request.json() as any;
      brandId = body.id;
    } catch {}
  }
  if (!brandId) {
    return createErrorResponse(400, 'Brand ID is required', 'MISSING_ID');
  }
  // Fetch the brand document using a cross-partition query to get the correct partition key (/userId)
  const query = {
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: brandId }]
  };
  const { resources } = await container.items.query<BrandDocument>(query).fetchAll();
  const brand = resources[0];
  if (!brand || brand.userId !== userId) {
    return createErrorResponse(404, 'Brand not found', 'RESOURCE_NOT_FOUND');
  }
  try {
    await container.item(brandId, brand.userId).delete();
    const response: BrandResponse = { id: brandId, name: brand.brandInfo?.name };
    return createResponse(200, response);
  } catch (error) {
    return createErrorResponse(500, 'Failed to delete brand', 'DELETE_ERROR');
  }
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

async function getBrandsByUserId(userId: string, pagination: PaginationParams): Promise<BrandDocument[]> {
  const { limit, offset, sortBy, sortOrder } = pagination;
  const querySpec = {
    query: `
      SELECT * FROM c 
      WHERE c.userId = @userId 
      ORDER BY c.${sortBy} ${sortOrder}
      OFFSET @offset LIMIT @limit
    `,
    parameters: [
      { name: '@userId', value: userId },
      { name: '@offset', value: offset || 0 },
      { name: '@limit', value: limit || DEFAULT_PAGE_SIZE }
    ]
  };
  const { resources: brands } = await container.items.query<BrandDocument>(querySpec).fetchAll();
  return brands;
}

async function getBrandById(brandId: string, userId: string): Promise<BrandDocument | undefined> {
  // Fetch using cross-partition query to get correct partition key
  const query = {
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: brandId }]
  };
  const { resources } = await container.items.query<BrandDocument>(query).fetchAll();
  const brand = resources[0];
  if (!brand || brand.userId !== userId) {
    return undefined;
  }
  return brand;
}

async function updateBrand(brandId: string, userId: string, updateData: BrandUpdate): Promise<BrandDocument | undefined> {
  // Fetch using cross-partition query to get correct partition key
  const query = {
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: brandId }]
  };
  const { resources } = await container.items.query<BrandDocument>(query).fetchAll();
  const existingBrand = resources[0];
  if (!existingBrand || existingBrand.userId !== userId) {
    return undefined;
  }
  const updatedBrand: BrandDocument = {
    ...existingBrand,
    metadata: {
      ...existingBrand.metadata,
      updatedDate: new Date().toISOString()
    },
    brandInfo: {
      ...existingBrand.brandInfo,
      ...(updateData.brandInfo || {})
    },
    socialAccounts: updateData.socialAccounts || existingBrand.socialAccounts
  };
  const { resource: savedBrand } = await container.item(brandId, existingBrand.userId).replace(updatedBrand);
  return savedBrand;
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
  const error: any = {
    message,
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

app.http('brand_management', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'brand_management/{id?}',
  handler: brandManagement
});