export interface BaseModel {
  id?: string;
  metadata: {
    createdDate: string;
    updatedDate: string;
    isActive: boolean;
  };
}