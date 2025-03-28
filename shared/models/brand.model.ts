import { BaseModel } from './base.model';

export interface SocialAccount {
  enabled: boolean;
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface Brand extends BaseModel {
  // Core brand information
  brandInfo: {
    name: string;
    description?: string;
    userId: string;
  };

  // Social media configuration
  socialAccounts?: {
    instagram?: SocialAccount;
    facebook?: SocialAccount;
    tiktok?: SocialAccount;
  };
}

export interface BrandRequest {
  name: string;
  description?: string;
}