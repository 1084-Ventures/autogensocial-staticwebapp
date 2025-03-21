import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from 'uuid';
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const container = database.container(process.env.COSMOS_DB_CONTAINER || '');

export async function brand_management(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
  
    if (request.method === 'POST') {
      try {
        interface BrandRequest {
            brandName: string;
        }
        const { brandName } = await request.json() as BrandRequest;
        const newBrand = {
          "Brand Name": brandName,
          "ID": uuidv4(),
          "User ID": "someUserId", // Replace with real user ID if needed
          "CreatedDate": new Date().toISOString(),
          "UpdatedDate": new Date().toISOString()
        };
        
        const { resource: createdBrand } = await container.items.create(newBrand);
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
