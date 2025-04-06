import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { BrandDocument, BrandCreate, BrandUpdate, BrandNameResponse } from '../models/brand.model';
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = await extractUserId(request);

    if (request.method === 'POST') {
      const body = await request.json() as BrandCreate;
      if (!body.name) {
        return createResponse(400, { error: 'Brand name is required' });
      }

      const newBrand: BrandDocument = createBrandDocument(body, userId);
      const { resource: createdBrand } = await container.items.create(newBrand);
      
      if (!createdBrand) {
        return createResponse(500, { error: 'Failed to create brand' });
      }

      const response: BrandNameResponse = {
        id: createdBrand.id,
        name: createdBrand.brandInfo.name
      };

      return createResponse(201, response);
    }

    if (request.method === 'GET') {
      const brandId = request.url.split('/').pop();
      
      // If no brandId is provided, return all brand names for the user
      if (!brandId || brandId === 'brand_management') {
        const brandNames = await getBrandNamesByUserId(userId);
        return createResponse(200, brandNames);
      }

      // If brandId is provided, return full brand details
      const brand = await getBrandById(brandId, userId);
      if (!brand) {
        return createResponse(404, { error: 'Brand not found' });
      }
      return createResponse(200, brand);
    }

    if (request.method === 'PUT') {
      // Extract ID from URL path
      const brandId = request.url.split('/').pop();
      if (!brandId) {
        return createResponse(400, { error: 'Brand ID is required' });
      }

      // Log for debugging
      context.log('BrandId:', brandId);

      const updateData = await request.json() as BrandUpdate;
      context.log('UpdateData:', JSON.stringify(updateData));

      const updatedBrand = await updateBrand(brandId, userId, updateData);

      if (!updatedBrand) {
        return createResponse(404, { error: 'Brand not found' });
      }

      return createResponse(200, updatedBrand);
    }

    return createResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    context.log("Error:", error);
    return createResponse(500, { error: 'Internal Server Error' });
  }
}

function createBrandDocument(body: BrandCreate, userId: string): BrandDocument {
  const currentDate = new Date().toISOString();
  return {
    id: randomUUID(),
    metadata: {
      createdDate: currentDate,
      updatedDate: currentDate,
      isActive: true
    },
    brandInfo: {
      name: body.name,
      userId,
      description: ''
    },
    socialAccounts: {
      instagram: { enabled: false, username: '', accessToken: '' },
      facebook: { enabled: false, username: '', accessToken: '' },
      tiktok: { enabled: false, username: '', accessToken: '' }
    }
  };
}

// Add this new function to fetch only brand names
async function getBrandNamesByUserId(userId: string): Promise<BrandNameResponse[]> {
  const querySpec = {
    query: 'SELECT c.id, c.brandInfo.name FROM c WHERE c.brandInfo.userId = @userId',
    parameters: [{ name: '@userId', value: userId }]
  };
  const { resources: brands } = await container.items.query<BrandNameResponse>(querySpec).fetchAll();
  return brands;
}

async function getBrandById(brandId: string, userId: string): Promise<BrandDocument | undefined> {
  const { resource: brand } = await container.item(brandId, brandId).read<BrandDocument>();
  if (!brand || brand.brandInfo.userId !== userId) {
    return undefined;
  }
  return brand;
}

async function updateBrand(brandId: string, userId: string, updateData: BrandUpdate): Promise<BrandDocument | undefined> {
  const { resource: existingBrand } = await container.item(brandId, brandId).read<BrandDocument>();
  
  if (!existingBrand || existingBrand.brandInfo.userId !== userId) {
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
      name: updateData.name ?? existingBrand.brandInfo.name,
      description: updateData.description ?? existingBrand.brandInfo.description
    },
    socialAccounts: {
      instagram: {
        ...existingBrand.socialAccounts.instagram,
        ...updateData.socialAccounts?.instagram
      },
      facebook: {
        ...existingBrand.socialAccounts.facebook,
        ...updateData.socialAccounts?.facebook
      },
      tiktok: {
        ...existingBrand.socialAccounts.tiktok,
        ...updateData.socialAccounts?.tiktok
      }
    }
  };

  const { resource: savedBrand } = await container.item(brandId, brandId).replace(updatedBrand);
  return savedBrand;
}

function createResponse(status: number, body: any): HttpResponseInit {
  // Add validation for BrandNameResponse
  if (status === 201 && body && 'id' in body && 'name' in body) {
    const brandResponse: BrandNameResponse = {
      id: body.id,
      name: body.name
    };
    return {
      status,
      body: JSON.stringify(brandResponse),
      headers: { 'Content-Type': 'application/json' }
    };
  }
  
  return {
    status,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
}

async function extractUserId(request: HttpRequest): Promise<string> {
  const clientPrincipal = request.headers.get('x-ms-client-principal');
  if (!clientPrincipal) return 'anonymous';

  const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
  const principalObject = JSON.parse(decodedPrincipal);
  return principalObject.userId || 'anonymous';
}

app.http('brand_management', {
  methods: ['GET', 'POST', 'PUT'],
  authLevel: 'anonymous',
  route: 'brand_management/{id?}', // Ensure route parameter is defined
  handler: brand_management
});