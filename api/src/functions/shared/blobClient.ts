import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, SASProtocol, generateBlobSASQueryParameters } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
export const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
export const accountName = blobServiceClient.accountName;
const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
export const accountKey = keyMatch ? keyMatch[1] : '';
export const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

export { BlobSASPermissions, SASProtocol, generateBlobSASQueryParameters };
