import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { components } from '../../../../generated/models';
import { MaterialModule } from '../../../../material.module';

@Component({
  selector: 'app-template-info-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <section class="form-section">
      <h3 mat-subheader>Template Info</h3>
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="templateInfo.name" (ngModelChange)="onChange()" name="templateName" maxlength="100" required>
      </mat-form-field>
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="templateInfo.description" (ngModelChange)="onChange()" name="templateDescription" maxlength="500"></textarea>
      </mat-form-field>
      <!-- Content type and platforms can be added here as needed -->
    </section>
  `
})
export class TemplateInfoEditorComponent {
  @Input() templateInfo!: components["schemas"]["TemplateInfo"];
  @Output() templateInfoChange = new EventEmitter<components["schemas"]["TemplateInfo"]>();

  onChange() {
    this.templateInfoChange.emit(this.templateInfo);
  }
}
