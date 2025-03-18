import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UploadPageComponent } from './upload-page.component';

@NgModule({
  imports: [
    CommonModule,
    UploadPageComponent,
    RouterModule.forChild([
      { path: '', component: UploadPageComponent }
    ])
  ]
})
export class UploadPageModule { }