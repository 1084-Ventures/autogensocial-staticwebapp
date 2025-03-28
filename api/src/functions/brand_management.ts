import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { Brand, BrandRequest } from '../../../shared/models/brand.model';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === 'POST') {
      try {
        const { name, description } = await request.json() as BrandRequest;
        const userId = await extractUserId(request);

        const newBrand: Brand = {
          metadata: {
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            isActive: true
          },
          brandInfo: {
            name,
            description,
            userId
          },
          socialAccounts: {
            instagram: { enabled: false, username: '', accessToken: '' },
            facebook: { enabled: false, username: '', accessToken: '' },
            tiktok: { enabled: false, username: '', accessToken: '' }
          }
        };

        const { resource: createdBrand } = await container.items.create<Brand>(newBrand);
        return { 
          body: JSON.stringify(createdBrand),
          headers: { 'Content-Type': 'application/json' },
          status: 201 
        };
      } catch (error) {
        context.log('Error creating brand:', error);
        return { 
          body: JSON.stringify({ error: 'Error creating brand' }),
          headers: { 'Content-Type': 'application/json' },
          status: 500 
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
        const { resources } = await container.items.query(querySpec).fetchAll();
        return { 
          body: JSON.stringify(resources),
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
