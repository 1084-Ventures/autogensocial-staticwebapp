import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreatePageComponent } from './create-page.component';

@NgModule({
  imports: [
    CommonModule,
    CreatePageComponent,
    RouterModule.forChild([
      { path: '', component: CreatePageComponent }
    ])
  ]
})
export class CreatePageModule { }