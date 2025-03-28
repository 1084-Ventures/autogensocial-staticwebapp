import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandemptyPageComponent } from './brandempty-page.component';

@NgModule({
  imports: [
    CommonModule,
    BrandemptyPageComponent,
    RouterModule.forChild([
      { path: '', component: BrandemptyPageComponent }
    ])
  ]
})
export class BrandemptyPageModule { }