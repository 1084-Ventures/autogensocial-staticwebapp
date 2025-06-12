import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
// import { BlobServiceClient } from "@azure/storage-blob"; // Uncomment when implementing blob upload
// import { analyzeMediaWithCognitiveServices } from "../services/cognitive"; // Placeholder for cognitive analysis
import { randomUUID } from "crypto";
import { MediaDocument, MediaCreate, MediaMetadata, MediaUpdate } from '../models/media.model';

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING || '');
const database = client.database(process.env.COSMOS_DB_NAME || '');
const mediaContainer = database.container(process.env.COSMOS_DB_CONTAINER_MEDIA || '');
// const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');

export const mediaManagement = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    context.log('Request received in media_management');
    context.log('Method:', request.method);
    context.log('URL:', request.url);
    context.log('Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
    const userId = await extractUserId(request);
    context.log('Extracted userId:', userId);
    if (!userId || userId === 'anonymous') {
        context.log('User not authenticated');
        return createErrorResponse(401, 'User not authenticated', 'UNAUTHENTICATED');
    }
    try {
        switch (request.method) {
            case 'GET':
                context.log('Dispatching to handleGet');
                return await handleGet(request, userId, context);
            case 'POST':
                context.log('Dispatching to handleUpload');
                return await handleUpload(request, userId, context);
            case 'DELETE':
                context.log('Dispatching to handleDelete');
                return await handleDelete(request, userId, context);
            case 'PUT':
                context.log('Dispatching to handleUpdate');
                return await handleUpdate(request, userId, context);
            default:
                context.log('Unsupported HTTP method:', request.method);
                return createErrorResponse(405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
        }
    } catch (err) {
        context.log('Unhandled error in media_management:', err);
        return createErrorResponse(500, 'Internal Server Error', 'INTERNAL_ERROR');
    }
}

async function handleGet(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('handleGet: URL:', request.url);
        // Extract media id from route if present
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        context.log('handleGet: Parsed id:', id);
        if (id && id !== 'media_management') {
            // Fetch single media by id using cross-partition query
            context.log('handleGet: Fetching single media by id');
            const { resources } = await mediaContainer.items.query<MediaDocument>({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
            const resource = resources[0];
            if (!resource) {
                context.log('handleGet: Media not found for id:', id);
                return createErrorResponse(404, 'Media not found', 'NOT_FOUND');
            }
            // Generate SAS URL for blob
            const azureBlob = require('@azure/storage-blob');
            const BlobServiceClient = azureBlob.BlobServiceClient;
            const generateBlobSASQueryParameters = azureBlob.generateBlobSASQueryParameters;
            const BlobSASPermissions = azureBlob.BlobSASPermissions;
            const SASProtocol = azureBlob.SASProtocol;
            const StorageSharedKeyCredential = azureBlob.StorageSharedKeyCredential;
            const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const accountName = blobServiceClient.accountName;
            const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
            if (!accountName || !keyMatch) {
                context.log('Missing accountName or AccountKey in connection string');
                return createErrorResponse(500, 'Storage account credentials not configured', 'INTERNAL_ERROR');
            }
            const accountKey = keyMatch[1];
            const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
            // Extract blob path from blobUrl
            const urlObj = new URL(resource.blobUrl);
            const blobPath = urlObj.pathname.replace(/^\//, '');
            const containerName = 'media';
            const blobName = blobPath.substring(blobPath.indexOf(containerName) + containerName.length + 1);
            const sasToken = generateBlobSASQueryParameters({
                containerName,
                blobName,
                permissions: BlobSASPermissions.parse('r'),
                startsOn: new Date(),
                expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                protocol: SASProtocol.Https
            }, sharedKeyCredential).toString();
            const sasUrl = `${urlObj.origin}/${containerName}/${blobName}?${sasToken}`;
            resource.blobUrl = sasUrl;
            return createResponse(200, resource);
        } else {
            // List all media for user
            context.log('handleGet: Listing all media for user:', userId);
            const query = {
                query: 'SELECT * FROM c WHERE c.userId = @userId',
                parameters: [{ name: '@userId', value: userId }]
            };
            const { resources } = await mediaContainer.items.query<MediaDocument>(query).fetchAll();
            // Add SAS URL to each resource
            const azureBlob = require('@azure/storage-blob');
            const BlobServiceClient = azureBlob.BlobServiceClient;
            const generateBlobSASQueryParameters = azureBlob.generateBlobSASQueryParameters;
            const BlobSASPermissions = azureBlob.BlobSASPermissions;
            const SASProtocol = azureBlob.SASProtocol;
            const StorageSharedKeyCredential = azureBlob.StorageSharedKeyCredential;
            const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const accountName = blobServiceClient.accountName;
            const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
            if (!accountName || !keyMatch) {
                context.log('Missing accountName or AccountKey in connection string');
                return createErrorResponse(500, 'Storage account credentials not configured', 'INTERNAL_ERROR');
            }
            const accountKey = keyMatch[1];
            const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
            const containerName = 'media';
            for (const resource of resources) {
                const urlObj = new URL(resource.blobUrl);
                const blobPath = urlObj.pathname.replace(/^\//, '');
                const blobName = blobPath.substring(blobPath.indexOf(containerName) + containerName.length + 1);
                const sasToken = generateBlobSASQueryParameters({
                    containerName,
                    blobName,
                    permissions: BlobSASPermissions.parse('r'),
                    startsOn: new Date(),
                    expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                    protocol: SASProtocol.Https
                }, sharedKeyCredential).toString();
                const sasUrl = `${urlObj.origin}/${containerName}/${blobName}?${sasToken}`;
                resource.blobUrl = sasUrl;
            }
            return createResponse(200, resources);
        }
    } catch (error: any) {
        context.log('Error in handleGet:', error);
        return createErrorResponse(500, 'Failed to fetch media', 'INTERNAL_ERROR');
    }
}

async function handleUpload(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('handleUpload: Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
        // Parse multipart/form-data
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.startsWith('multipart/form-data')) {
            context.log('handleUpload: Invalid content-type:', contentType);
            return createErrorResponse(400, 'Content-Type must be multipart/form-data', 'INVALID_CONTENT_TYPE');
        }
        // Get body as Buffer
        const rawBody = request.body ? Buffer.from(await request.arrayBuffer()) : null;
        if (!rawBody) {
            context.log('handleUpload: Missing request body');
            return createErrorResponse(400, 'Missing request body', 'MISSING_BODY');
        }
        // Use busboy for parsing
        const busboy = require('busboy');
        const bb = busboy({ headers: { 'content-type': contentType } });
        const fields: Record<string, string> = {};
        let fileBuffer: Buffer | null = null;
        let fileName = '';
        let brandId = '';
        let fileMimeType = '';
        let tags: { name: string; confidence: number }[] = [];
        let description = '';
        let metaFileName = '';
        let categories: any[] = [];
        let objects: any[] = [];
        let caption: any = undefined;
        let denseCaptions: any[] = [];
        let brands: any[] = [];
        let people: any[] = [];
        let ocrText: string | undefined = undefined;
        let cognitiveData: any = undefined;
        const filePromise = new Promise<void>((resolve, reject) => {
            bb.on('file', (nameField: string, file: any, info: any) => {
                fileName = info.filename;
                fileMimeType = info.mimeType;
                const buffers: Buffer[] = [];
                file.on('data', (data: Buffer) => buffers.push(data));
                file.on('end', () => {
                    fileBuffer = Buffer.concat(buffers);
                });
            });
            bb.on('field', (fieldName: string, val: string) => {
                fields[fieldName] = val;
                if (fieldName === 'brandId') brandId = val;
                if (fieldName === 'tags') tags = val.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => ({ name: t, confidence: 1 }));
                if (fieldName === 'description') description = val;
                if (fieldName === 'name') metaFileName = val;
            });
            bb.on('finish', resolve);
            bb.on('error', reject);
        });
        bb.end(rawBody);
        await filePromise;
        context.log('handleUpload: fileName:', fileName, 'brandId:', brandId, 'fileMimeType:', fileMimeType, 'tags:', tags, 'description:', description, 'metaFileName:', metaFileName);
        if (!fileBuffer || !brandId) {
            context.log('handleUpload: Missing file or brandId');
            return createErrorResponse(400, 'Missing file or brandId', 'MISSING_DATA');
        }
        // Upload to blob storage
        const azureBlob = require('@azure/storage-blob');
        const BlobServiceClient = azureBlob.BlobServiceClient;
        const generateBlobSASQueryParameters = azureBlob.generateBlobSASQueryParameters;
        const BlobSASPermissions = azureBlob.BlobSASPermissions;
        const SASProtocol = azureBlob.SASProtocol;
        const StorageSharedKeyCredential = azureBlob.StorageSharedKeyCredential;
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
        const containerClient = blobServiceClient.getContainerClient('media');
        // Generate a new id for the media
        const id = randomUUID();
        // Get file extension from original fileName
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        // Use id + extension for blob name
        const blobPath = `${userId}/${brandId}/${id}${ext}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
        await blockBlobClient.uploadData(fileBuffer, { blobHTTPHeaders: { blobContentType: fileMimeType } });
        // Generate a SAS token for the blob (read access, 1 hour expiry) using the connection string
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
        const blobServiceClientForSAS = BlobServiceClient.fromConnectionString(connectionString);
        const accountName = blobServiceClientForSAS.accountName;
        // Extract account key from connection string
        const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
        if (!accountName || !keyMatch) {
            context.log('Missing accountName or AccountKey in connection string');
            return createErrorResponse(500, 'Storage account credentials not configured', 'INTERNAL_ERROR');
        }
        const accountKey = keyMatch[1];
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        const sasToken = generateBlobSASQueryParameters({
            containerName: 'media',
            blobName: `${userId}/${brandId}/${id}${ext}`,
            permissions: BlobSASPermissions.parse('r'),
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            protocol: SASProtocol.Https
        }, sharedKeyCredential).toString();
        const blobUrl = `${blockBlobClient.url}?${sasToken}`;
        context.log('handleUpload: Uploaded to blobUrl with SAS:', blobUrl);
        // Use form's metaFileName as fileName in metadata
        // Compose metadata using new cognitive structure if available in fields
        // If cognitiveData is sent in the form, parse and use it
        if (fields.cognitiveData) {
          try {
            cognitiveData = JSON.parse(fields.cognitiveData);
            tags = cognitiveData.tags || [];
            categories = cognitiveData.categories || [];
            objects = cognitiveData.objects || [];
            caption = cognitiveData.caption;
            denseCaptions = cognitiveData.denseCaptions || [];
            brands = cognitiveData.brands || [];
            people = cognitiveData.people || [];
            ocrText = cognitiveData.ocrText;
          } catch (e) {
            context.log('Failed to parse cognitiveData:', e);
          }
        } else if (fields.tags && typeof fields.tags === 'string') {
          // fallback: parse tags as comma-separated string if not cognitive
          tags = String(fields.tags).split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => ({ name: t, confidence: 1 }));
        }
        const metadata: MediaMetadata = {
          fileName: metaFileName,
          tags,
          description,
          categories,
          objects,
          caption,
          denseCaptions,
          brands,
          people,
          ocrText,
          cognitiveData
        };
        // Infer mediaType from MIME type
        let mediaType: 'image' | 'video' = 'image';
        if (fileMimeType.startsWith('video/')) {
            mediaType = 'video';
        }
        const now = new Date().toISOString();
        const mediaDoc: MediaDocument = {
            id,
            userId,
            brandId,
            blobUrl,
            metadata,
            createdAt: now,
            updatedAt: now,
            mediaType,
        };
        await mediaContainer.items.create(mediaDoc);
        context.log('handleUpload: Media document created in Cosmos DB:', JSON.stringify(mediaDoc));
        return createResponse(201, mediaDoc);
    } catch (error: any) {
        context.log('Error in handleUpload:', error);
        return createErrorResponse(500, 'Failed to upload media', 'INTERNAL_ERROR');
    }
}

async function handleDelete(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('handleDelete: URL:', request.url);
        // Parse media id from route or body
        const url = new URL(request.url);
        let id = url.pathname.split('/').pop();
        context.log('handleDelete: Parsed id:', id);
        if (!id || id === 'media_management') {
            // Try to get from body
            const body = request.body ? JSON.parse(Buffer.from(await request.arrayBuffer()).toString()) : {};
            id = body.id;
            context.log('handleDelete: Parsed id from body:', id);
        }
        if (!id) {
            context.log('handleDelete: Missing media id');
            return createErrorResponse(400, 'Missing media id', 'MISSING_ID');
        }
        // Fetch media document using correct partition key (brandId)
        // First, get the document by id using a cross-partition query to get brandId
        const query = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [{ name: '@id', value: id }]
        };
        const { resources } = await mediaContainer.items.query<MediaDocument>(query).fetchAll();
        const mediaDoc = resources[0];
        if (!mediaDoc) {
            context.log('handleDelete: Media not found for id:', id);
            return createErrorResponse(404, 'Media not found', 'NOT_FOUND');
        }
        // Verify user/brand ownership
        if (mediaDoc.userId !== userId) {
            context.log('handleDelete: Forbidden, not owner');
            return createErrorResponse(403, 'Forbidden: not owner', 'FORBIDDEN');
        }
        // Delete blob from storage
        const { BlobServiceClient } = require('@azure/storage-blob');
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
        const containerClient = blobServiceClient.getContainerClient('media');
        // Extract blob path from blobUrl
        const blobUrl = mediaDoc.blobUrl;
        const urlObj = new URL(blobUrl);
        // Remove leading slash from pathname
        const blobPath = urlObj.pathname.replace(/^\//, '');
        const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
        await blockBlobClient.deleteIfExists();
        context.log('handleDelete: Deleted blob from storage:', blobPath);
        // Delete metadata from Cosmos DB using correct partition key (brandId)
        await mediaContainer.item(id, mediaDoc.brandId).delete();
        context.log('handleDelete: Deleted media document from Cosmos DB:', id);
        return createResponse(200, { message: 'Media deleted', id });
    } catch (error: any) {
        context.log('Error in handleDelete:', error);
        return createErrorResponse(500, 'Failed to delete media', 'INTERNAL_ERROR');
    }
}

async function handleUpdate(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('handleUpdate: URL:', request.url);
        // Parse media id from route or body
        const url = new URL(request.url);
        let id = url.pathname.split('/').pop();
        context.log('handleUpdate: Parsed id:', id);
        let update: Partial<MediaUpdate> = {};
        if (!id || id === 'media_management') {
            // Try to get from body
            const body = request.body ? JSON.parse(Buffer.from(await request.arrayBuffer()).toString()) : {};
            id = body.id;
            update = body.update || {};
            context.log('handleUpdate: Parsed id and update from body:', id, update);
        } else {
            // Get update from body
            update = request.body ? JSON.parse(Buffer.from(await request.arrayBuffer()).toString()) : {};
            context.log('handleUpdate: Parsed update from body:', update);
        }
        if (!id) {
            context.log('handleUpdate: Missing media id');
            return createErrorResponse(400, 'Missing media id', 'MISSING_ID');
        }
        // Fetch media document by id using cross-partition query
        const { resources } = await mediaContainer.items.query<MediaDocument>({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
        const mediaDoc = resources[0];
        if (!mediaDoc) {
            context.log('handleUpdate: Media not found for id:', id);
            return createErrorResponse(404, 'Media not found', 'NOT_FOUND');
        }
        // Verify user/brand ownership
        if (mediaDoc.userId !== userId) {
            context.log('handleUpdate: Forbidden, not owner');
            return createErrorResponse(403, 'Forbidden: not owner', 'FORBIDDEN');
        }
        // Update metadata or name
        const updatedDoc = {
            ...mediaDoc,
            ...update,
            updatedAt: new Date().toISOString(),
        };
        await mediaContainer.item(id, mediaDoc.brandId).replace(updatedDoc);
        context.log('handleUpdate: Updated media document in Cosmos DB:', JSON.stringify(updatedDoc));
        return createResponse(200, updatedDoc);
    } catch (error: any) {
        context.log('Error in handleUpdate:', error);
        return createErrorResponse(500, 'Failed to update media', 'INTERNAL_ERROR');
    }
}

function createResponse(status: number, body: any): HttpResponseInit {
    return {
        status,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

function createErrorResponse(status: number, message: string, code?: string): HttpResponseInit {
    return createResponse(status, { error: message, code });
}

async function extractUserId(request: HttpRequest): Promise<string> {
    const clientPrincipal = request.headers.get('x-ms-client-principal');
    if (!clientPrincipal) return 'anonymous';
    try {
        const decodedPrincipal = Buffer.from(clientPrincipal, 'base64').toString('ascii');
        const principalObject = JSON.parse(decodedPrincipal);
        return principalObject.userId || 'anonymous';
    } catch (error) {
        return 'anonymous';
    }
}

app.http('media_management', {
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    authLevel: 'anonymous',
    route: 'media_management/{id?}',
    handler: mediaManagement
});
