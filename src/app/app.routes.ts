import { Routes } from '@angular/router';
import { MainlayoutComponent } from './layouts/mainlayout/mainlayout.component';
import { SimplelayoutComponent } from './layouts/simplelayout/simplelayout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/create',
    pathMatch: 'full'
  },
  {
    path: '',
    component: SimplelayoutComponent,
    children: [
      {
        path: 'create',
        loadChildren: () => import('./pages/create-page/create-page.module').then(m => m.CreatePageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings-page/settings-page.module').then(m => m.SettingsPageModule)
      }
    ]
  },
  {
    path: '',
    component: MainlayoutComponent,
    children: [
      {
        path: 'brand',
        loadChildren: () => import('./pages/brand-page/brand-page.module').then(m => m.BrandPageModule)
      },
      {
        path: 'upload',
        loadChildren: () => import('./pages/upload-page/upload-page.module').then(m => m.UploadPageModule)
      },
      {
        path: 'generate',
        loadChildren: () => import('./pages/generate-page/generate-page.module').then(m => m.GeneratePageModule)
      }
    ]
  }
];