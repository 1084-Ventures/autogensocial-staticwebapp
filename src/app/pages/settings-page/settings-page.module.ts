import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsPageComponent } from './settings-page.component';

@NgModule({
  imports: [
    CommonModule,
    SettingsPageComponent,
    RouterModule.forChild([
      { path: '', component: SettingsPageComponent }
    ])
  ]
})
export class SettingsPageModule { }