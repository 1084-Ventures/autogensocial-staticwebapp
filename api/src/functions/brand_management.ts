import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    context.log('Request method:', request.method);
    context.log('Request URL:', request.url);
    context.log('Request headers:', JSON.stringify(request.headers));
    context.log('COSMOS_DB_CONNECTION_STRING:', process.env.COSMOS_DB_CONNECTION_STRING);
    context.log('COSMOS_DB_NAME:', process.env.COSMOS_DB_NAME);
    context.log('COSMOS_DB_CONTAINER:', process.env.COSMOS_DB_CONTAINER);

    if (request.method === 'POST') {
      try {
        interface BrandRequest {
            brandName: string;
        }
        const { brandName } = await request.json() as BrandRequest;
        context.log('Parsed brandName:', brandName);

        // Extract userId from the x-ms-client-principal header
        const clientPrincipal = request.headers['x-ms-client-principal'];
        let userId = 'anonymous';
        if (clientPrincipal) {
            const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
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

    const name = request.query.get('name') || await request.text() || 'world';
    return { body: `Hello, ${name}!` };
}

app.http('brand_management', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: brand_management
});
