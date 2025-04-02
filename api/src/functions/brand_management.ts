import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { BrandDocument, BrandCreate } from '../models/brand.model';
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
      return createResponse(201, createdBrand);
    }

    if (request.method === 'GET') {
      const brands = await getBrandsByUserId(userId);
      return createResponse(200, brands);
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
      description: body.description || undefined
    },
    socialAccounts: {
      instagram: { enabled: false, username: '', accessToken: '' },
      facebook: { enabled: false, username: '', accessToken: '' },
      tiktok: { enabled: false, username: '', accessToken: '' }
    }
  };
}

async function getBrandsByUserId(userId: string): Promise<BrandDocument[]> {
  const querySpec = {
    query: 'SELECT * FROM c WHERE c.brandInfo.userId = @userId',
    parameters: [{ name: '@userId', value: userId }]
  };
  const { resources: brands } = await container.items.query<BrandDocument>(querySpec).fetchAll();
  return brands;
}

function createResponse(status: number, body: any): HttpResponseInit {
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
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: brand_management
});