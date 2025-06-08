// Media model for Cosmos DB and API

export interface MediaMetadata {
  fileName: string;
  description?: string;
  tags?: string[];
  cognitiveData?: Record<string, any>;
}

export interface MediaDocument {
  id: string;
  userId: string;
  brandId: string;
  blobUrl: string;
  mediaType: 'image' | 'video';
  metadata: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MediaCreate {
  brandId: string;
  fileName: string;
  mediaType: 'image' | 'video';
  // file: Buffer | File; // Not included here, handled in upload logic
}

export interface MediaUpdate {
  fileName?: string;
  metadata?: Partial<MediaMetadata>;
}
