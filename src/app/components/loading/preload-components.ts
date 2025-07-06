// This file triggers preloading of key standalone components after app bootstrap
export function preloadStandaloneComponents() {
  import('../../pages/brand-page/brand-page.component').then(m => m.BrandPageComponent);
  import('../../pages/upload-page/upload-page.component').then(m => m.UploadPageComponent);
  import('../../pages/content-template-page/content-template-page.component').then(m => m.ContentTemplatePageComponent);
}
