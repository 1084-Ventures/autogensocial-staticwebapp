import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { BrandDocument, BrandCreate } from '../../../shared/models/brand.model';
import { randomUUID } from 'crypto';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'POST') {
    try {
      const rawBody = await request.text();
      context.log("Raw request body:", rawBody);

      const body = JSON.parse(rawBody) as BrandCreate;
      context.log("Parsed request:", JSON.stringify(body, null, 2));

      if (!body.name) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'Brand name is required' }),
          headers: { 'Content-Type': 'application/json' }
        };
      }

      const userId = await extractUserId(request);
      
      const currentDate = new Date().toISOString();
      const newBrand: BrandDocument = {
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
          instagram: {
            enabled: false,
            username: '',
            accessToken: '',
            refreshToken: undefined,
            expiresAt: undefined
          },
          facebook: {
            enabled: false,
            username: '',
            accessToken: '',
            refreshToken: undefined,
            expiresAt: undefined
          },
          tiktok: {
            enabled: false,
            username: '',
            accessToken: '',
            refreshToken: undefined,
            expiresAt: undefined
          }
        }
      };

      context.log("New brand object:", JSON.stringify(newBrand, null, 2));
      const { resource: createdBrand } = await container.items.create(newBrand);
      context.log("Created brand:", JSON.stringify(createdBrand, null, 2));

      return {
        status: 201,
        body: JSON.stringify(createdBrand),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      context.log("Error creating brand:", error);
      return {
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (request.method === 'GET') {
    try {
      const userId = await extractUserId(request);
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.brandInfo.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      };

      const { resources: brands } = await container.items
        .query<BrandDocument>(querySpec)
        .fetchAll();

      const response = brands.map(brand => ({
        id: brand.id,
        metadata: brand.metadata,
        brandInfo: brand.brandInfo,
        socialAccounts: brand.socialAccounts
      }));

      return { 
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      };
    } catch (error) {
      context.log('Error querying brands:', error);
      return { 
        body: JSON.stringify({ error: 'Error retrieving brands' }),
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      };
    }
  }

  return {
      status: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
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