import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandPageComponent } from './brand-page.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    BrandPageComponent,
    RouterModule.forChild([
      { path: '', component: BrandPageComponent }
    ])
  ]
})
export class BrandPageModule { }