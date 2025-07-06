import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { components } from '../../../../generated/models';
import { MaterialModule } from '../../../../material.module';

@Component({
  selector: 'app-visual-style-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <section class="form-section">
      <h3 mat-subheader>Visual Style</h3>
      <!-- For simplicity, just show background color for now -->
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Background Color</mat-label>
        <input matInput [ngModel]="visualStyle.themes?.[0]?.backgroundColor" (ngModelChange)="onBackgroundColorChange($event)" name="backgroundColor">
      </mat-form-field>
    </section>
  `
})
export class VisualStyleEditorComponent {
  @Input() visualStyle!: components["schemas"]["VisualStyleObj"];
  @Output() visualStyleChange = new EventEmitter<components["schemas"]["VisualStyleObj"]>();

  onChange() {
    this.visualStyleChange.emit(this.visualStyle);
  }

  onBackgroundColorChange(value: string) {
    if (this.visualStyle.themes && this.visualStyle.themes[0]) {
      this.visualStyle.themes[0].backgroundColor = value;
      this.onChange();
    }
  }
}
