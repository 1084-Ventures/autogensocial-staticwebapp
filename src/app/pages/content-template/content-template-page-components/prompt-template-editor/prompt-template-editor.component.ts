import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { components } from '../../../../generated/models';
import { MaterialModule } from '../../../../material.module';

@Component({
  selector: 'app-prompt-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <section class="form-section">
      <h3 mat-subheader>Prompt Template</h3>
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>User Prompt</mat-label>
        <textarea matInput [(ngModel)]="promptTemplate.userPrompt" (ngModelChange)="onChange()" name="userPrompt"></textarea>
      </mat-form-field>
      <!-- Add fields for systemPrompt, temperature, maxTokens, model, variables as needed -->
    </section>
  `
})
export class PromptTemplateEditorComponent {
  @Input() promptTemplate!: components["schemas"]["PromptTemplate"];
  @Output() promptTemplateChange = new EventEmitter<components["schemas"]["PromptTemplate"]>();

  onChange() {
    this.promptTemplateChange.emit(this.promptTemplate);
  }
}
