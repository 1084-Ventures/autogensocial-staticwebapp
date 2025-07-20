import { CosmosClient, Database, Container } from "@azure/cosmos";

const connectionString = process.env.COSMOS_DB_CONNECTION_STRING || '';
const dbName = process.env.COSMOS_DB_NAME || '';

const templateContainerName = process.env.COSMOS_DB_CONTAINER_TEMPLATE || '';
const brandContainerName = process.env.COSMOS_DB_CONTAINER_BRAND || '';

const mediaContainerName = process.env.COSMOS_DB_CONTAINER_MEDIA || '';

export const cosmosClient = new CosmosClient(connectionString);
export const database: Database = cosmosClient.database(dbName);
export const mediaContainer: Container = database.container(mediaContainerName);
export const templateContainer: Container = database.container(templateContainerName);
export const brandContainer: Container = database.container(brandContainerName);

// Add more container exports as needed
