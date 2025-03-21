import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    for (const [key, value] of request.headers.entries()) {
      context.log(`${key}: ${value}`);
    }

    if (request.method === 'POST') {
      try {
        interface BrandRequest {
            brandName: string;
        }
        const { brandName } = await request.json() as BrandRequest;
        context.log('Parsed brandName:', brandName);

        // Extract userId from the x-ms-client-principal header
        const clientPrincipal = request.headers.get('x-ms-client-principal');
        context.log('Client principal:', clientPrincipal);
        let userId = 'anonymous';
        if (clientPrincipal) {
            const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
            context.log('Decoded principal:', decodedPrincipal);
            const principalObject = JSON.parse(decodedPrincipal);
            userId = principalObject.userId || 'anonymous';
        }
        context.log('Extracted userId:', userId);

        const newBrand = {
          "brandName": brandName,
          "userId": userId,
          "createdDate": new Date().toISOString(),
          "updatedDate": new Date().toISOString()
        };
        context.log('New brand object:', JSON.stringify(newBrand));
        
        const { resource: createdBrand } = await container.items.create(newBrand);
        context.log('Created brand:', JSON.stringify(createdBrand));
        return { body: JSON.stringify(createdBrand), status: 201 };
      } catch (error) {
        context.log('Error creating brand:', error);
        return { body: 'Error creating brand', status: 500 };
      }
    }

    if (request.method === 'GET') {
      try {
        // Extract userId from the x-ms-client-principal header
        const clientPrincipal = request.headers.get('x-ms-client-principal');
        let userId = 'anonymous';
        if (clientPrincipal) {
          const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
          const principalObject = JSON.parse(decodedPrincipal);
          userId = principalObject.userId || 'anonymous';
        }
    
        const querySpec = {
          query: 'SELECT * FROM c WHERE c.userId = @userId',
          parameters: [{ name: '@userId', value: userId }]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return { body: JSON.stringify(resources), status: 200 };
      } catch (error) {
        context.log('Error querying brands:', error);
        return { body: 'Error retrieving brands', status: 500 };
      }
    }
}

app.http('brand_management', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: brand_management
});
