import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GeneratePageComponent } from './generate-page.component';
import { MaterialModule } from '../../material.module';
import { ContentTextEditorComponent } from '../../components/content-text-editor/content-text-editor.component';
import { ContentImageEditorComponent } from '../../components/content-image-editor/content-image-editor.component';
import { ContentMultiImageEditorComponent } from '../../components/content-multi-image-editor/content-multi-image-editor.component';
import { ContentVideoEditorComponent } from '../../components/content-video-editor/content-video-editor.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    ContentTextEditorComponent,
    ContentImageEditorComponent,
    ContentMultiImageEditorComponent,
    ContentVideoEditorComponent,
    RouterModule.forChild([
      { path: '', component: GeneratePageComponent }
    ])
  ]
})
export class GeneratePageModule { }