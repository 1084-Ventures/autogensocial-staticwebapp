import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GeneratePageComponent } from './generate-page.component';

@NgModule({
  imports: [
    CommonModule,
    GeneratePageComponent,
    RouterModule.forChild([
      { path: '', component: GeneratePageComponent }
    ])
  ]
})
export class GeneratePageModule { }