import { Routes } from '@angular/router';
import { MainlayoutComponent } from './layouts/mainlayout/mainlayout.component';
import { SimplelayoutComponent } from './layouts/simplelayout/simplelayout.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { BrandGuard } from './core/guards/brand.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainlayoutComponent,
    children: [
      { path: '', redirectTo: 'brand-details', pathMatch: 'full' },
      // Empty state routes (no brand selected)
      { path: 'brand-details', loadComponent: () => import('./pages/brand-page/brand-page.component').then(m => m.BrandPageComponent) },
      { path: 'upload', loadComponent: () => import('./pages/upload-page/upload-page.component').then(m => m.UploadPageComponent) },
      { path: 'content-template', loadComponent: () => import('./pages/content-template-page/content-template-page.component').then(m => m.ContentTemplatePageComponent) },
      { path: 'brands', component: SidenavComponent },
      
      // Brand-specific routes
      {
        path: 'brand/:id',
        canActivate: [BrandGuard],
        children: [
          { path: 'brand-details', loadComponent: () => import('./pages/brand-page/brand-page.component').then(m => m.BrandPageComponent), data: { type: 'brand-details' } },
          { path: 'upload', loadComponent: () => import('./pages/upload-page/upload-page.component').then(m => m.UploadPageComponent), data: { type: 'upload' } },
          { path: 'content-template', loadComponent: () => import('./pages/content-template-page/content-template-page.component').then(m => m.ContentTemplatePageComponent), data: { type: 'content-template' } }
        ]
      }
    ]
  },
  {
    path: 'settings',
    component: SimplelayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/settings-page/settings-page.component').then(m => m.SettingsPageComponent)
      }
    ]
  }
];