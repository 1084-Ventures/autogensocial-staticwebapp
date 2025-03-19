export interface SocialAccountCredentials {
  enabled: boolean;
  username: string;
  apiKey: string;
}

export interface Brand {
  brandName: string;
  description: string;
  socialAccounts: {
    instagram: SocialAccountCredentials;
    facebook: SocialAccountCredentials;
    tiktok: SocialAccountCredentials;
  };
}

export function createEmptyBrand(): Brand {
  return {
    brandName: '',
    description: '',
    socialAccounts: {
      instagram: { enabled: false, username: '', apiKey: '' },
      facebook: { enabled: false, username: '', apiKey: '' },
      tiktok: { enabled: false, username: '', apiKey: '' }
    }
  };
}

export function brandFromFormData(formData: any): Brand {
  return {
    brandName: formData.brandName,
    description: formData.description,
    socialAccounts: {
      instagram: {
        enabled: formData.instagram,
        username: formData.instagramUsername,
        apiKey: formData.instagramApiKey
      },
      facebook: {
        enabled: formData.facebook,
        username: formData.facebookUsername,
        apiKey: formData.facebookApiKey
      },
      tiktok: {
        enabled: formData.tiktok,
        username: formData.tiktokUsername,
        apiKey: formData.tiktokApiKey
      }
    }
  };
}
