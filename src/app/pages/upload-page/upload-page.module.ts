import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UploadPageComponent } from './upload-page.component';
import { MediaUploadFormComponent } from '../../components/media-upload-form/media-upload-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: UploadPageComponent }
    ]),
    FormsModule,
    ReactiveFormsModule,
    UploadPageComponent,
    MediaUploadFormComponent
  ]
})
export class UploadPageModule { }