// Media model for Cosmos DB and API

export interface CognitiveTag {
  name: string;
  confidence: number;
}

export interface CognitiveObject {
  object: string;
  confidence: number;
  rectangle: { x: number; y: number; w: number; h: number };
}

export interface CognitiveCategory {
  name: string;
  confidence: number;
}

export interface CognitiveCaption {
  text: string;
  confidence: number;
}

export interface CognitiveDenseCaption {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; w: number; h: number };
}

export interface CognitiveBrand {
  name: string;
  confidence: number;
}

export interface CognitivePerson {
  confidence: number;
  rectangle: { x: number; y: number; w: number; h: number };
}

export interface CognitiveRead {
  text: string;
  boundingBox: { x: number; y: number; w: number; h: number };
}

export interface MediaMetadata {
  fileName: string;
  description?: string;
  tags?: CognitiveTag[];
  categories?: CognitiveCategory[];
  objects?: CognitiveObject[];
  caption?: CognitiveCaption;
  denseCaptions?: CognitiveDenseCaption[];
  brands?: CognitiveBrand[];
  people?: CognitivePerson[];
  ocrText?: string;
  cognitiveData?: Record<string, any>; // raw response for future-proofing
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
