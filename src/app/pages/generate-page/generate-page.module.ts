import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GeneratePageComponent } from './generate-page.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    GeneratePageComponent,
    RouterModule.forChild([
      { path: '', component: GeneratePageComponent }
    ])
  ]
})
export class GeneratePageModule { }