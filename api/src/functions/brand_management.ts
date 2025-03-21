import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from 'uuid';
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
  
    if (request.method === 'OPTIONS') {
      return {
          status: 204,
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
          }
      };
  }

    if (request.method === 'POST') {
      try {
        interface BrandRequest {
            brandName: string;
        }
        const { brandName } = await request.json() as BrandRequest;
        context.log('Parsed brandName:', brandName);
        const newBrand = {
          "Brand Name": brandName,
          "ID": uuidv4(),
          "User ID": "someUserId", // Replace with real user ID if needed
          "CreatedDate": new Date().toISOString(),
          "UpdatedDate": new Date().toISOString()
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
