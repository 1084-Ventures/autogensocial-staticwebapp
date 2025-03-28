import { Routes } from '@angular/router';
import { MainlayoutComponent } from './layouts/mainlayout/mainlayout.component';
import { SimplelayoutComponent } from './layouts/simplelayout/simplelayout.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { BrandGuard } from './guards/brand.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainlayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./pages/brandempty-page/brandempty-page.module').then(m => m.BrandemptyPageModule) },
      { path: 'brands', component: SidenavComponent },
      {
        path: 'brand',
        children: [
          {
            path: '',
            loadChildren: () => import('./pages/brandempty-page/brandempty-page.module').then(m => m.BrandemptyPageModule)
          },
          {
            path: ':id',
            canActivate: [BrandGuard],
            children: [
              { path: 'brand_details', loadChildren: () => import('./pages/brand-page/brand-page.module').then(m => m.BrandPageModule), data: { type: 'brand_details' } },
              { path: 'upload', loadChildren: () => import('./pages/upload-page/upload-page.module').then(m => m.UploadPageModule), data: { type: 'upload' } },
              { path: 'generate', loadChildren: () => import('./pages/generate-page/generate-page.module').then(m => m.GeneratePageModule), data: { type: 'generate' } }
            ]
          }
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
        loadChildren: () => import('./pages/settings-page/settings-page.module').then(m => m.SettingsPageModule)
      }
    ]
  }
];