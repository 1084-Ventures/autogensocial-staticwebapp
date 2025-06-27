
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ContentTemplatePageComponent } from './content-template-page/content-template-page.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  imports: [
    ContentTemplatePageComponent
  ],
  exports: [
    ContentTemplatePageComponent
  ]
})
export class ContentTemplateModule {}
