export interface BaseModel {
  id: string; // Make id required for database consistency
  metadata: {
    createdDate: string; // Use string for database storage
    updatedDate: string; // Use string for database storage
    isActive: boolean;
  };
}