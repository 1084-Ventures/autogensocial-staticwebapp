export interface BaseModel {
  id: string; // UUID v4 format
  metadata: {
    createdAt: string; // ISO 8601 date-time format
    updatedAt: string; // ISO 8601 date-time format
    isActive: boolean;
    version?: number;
  };
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}