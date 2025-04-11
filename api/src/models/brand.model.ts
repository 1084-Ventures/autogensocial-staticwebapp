import { BaseModel } from './base.model';

export interface SocialAccount {
  enabled: boolean;
  username: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO 8601 date-time format
}

export interface BrandDocument extends BaseModel {
  brandInfo: {
    name: string; // 1-100 characters
    description?: string; // max 500 characters
    userId: string; // UUID format
  };
  socialAccounts: {
    instagram: SocialAccount;
    facebook: SocialAccount;
    tiktok: SocialAccount;
  };
}

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
  id: string; // UUID format
  name: string;
}

export interface BrandCreate {
  name: string; // 1-100 characters
  description?: string; // max 500 characters
}

export interface BrandUpdate {
  name?: string; // 1-100 characters
  description?: string; // max 500 characters
  socialAccounts?: {
    instagram?: Partial<SocialAccount>;
    facebook?: Partial<SocialAccount>;
    tiktok?: Partial<SocialAccount>;
  };
}

// Validation functions
export function validateBrandName(name: string): boolean {
  return name.length > 0 && name.length <= 100;
}

export function validateBrandDescription(description?: string): boolean {
  return !description || description.length <= 500;
}

export function validateSocialAccount(account: Partial<SocialAccount>): boolean {
  if (account.expiresAt && !isValidISODate(account.expiresAt)) {
    return false;
  }
  return true;
}

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}