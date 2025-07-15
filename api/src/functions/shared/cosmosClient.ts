import { CosmosClient, Database, Container } from "@azure/cosmos";

const connectionString = process.env.COSMOS_DB_CONNECTION_STRING || '';
const dbName = process.env.COSMOS_DB_NAME || '';
const mediaContainerName = process.env.COSMOS_DB_CONTAINER_MEDIA || '';

export const cosmosClient = new CosmosClient(connectionString);
export const database: Database = cosmosClient.database(dbName);
export const mediaContainer: Container = database.container(mediaContainerName);

// Add more container exports as needed
