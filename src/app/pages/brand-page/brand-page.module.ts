import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandPageComponent } from './brand-page.component';

@NgModule({
  imports: [
    CommonModule,
    BrandPageComponent,
    RouterModule.forChild([
      { path: '', component: BrandPageComponent }
    ])
  ]
})
export class BrandPageModule { }