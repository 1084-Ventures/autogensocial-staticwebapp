import { BaseModel } from './base.model';

export interface SocialAccount {
  enabled: boolean;
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

// Document structure for Cosmos DB extending BaseModel
export interface BrandDocument extends BaseModel {
  brandInfo: {
    name: string;
    description?: string;
    userId: string;
  };
  socialAccounts: {
    instagram: SocialAccount;
    facebook: SocialAccount;
    tiktok: SocialAccount;
  };
}

// API interface extending BaseModel
export interface Brand extends BaseModel {
  brandInfo: {
    name: string;
    description?: string;
    userId: string;
  };
  socialAccounts?: {
    instagram?: SocialAccount;
    facebook?: SocialAccount;
    tiktok?: SocialAccount;
  };
}

export interface BrandNameResponse {
  id: string;
  name: string;
}

export interface BrandCreate {
  name: string;
  description?: string;
}

export interface BrandUpdate {
  name?: string;
  description?: string;
  socialAccounts?: {
    instagram?: Partial<SocialAccount>;
    facebook?: Partial<SocialAccount>;
    tiktok?: Partial<SocialAccount>;
  };
}