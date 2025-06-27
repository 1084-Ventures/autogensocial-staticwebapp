import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import type { components } from '../../generated/models';

type Text = components["schemas"]["Text"];

@Component({
  selector: 'app-content-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './content-text-editor.component.html',
  styleUrls: ['./content-text-editor.component.scss']
})
export class ContentTextEditorComponent {
  @Input() text: Text | undefined;
  @Output() textChange = new EventEmitter<Text>();

  onTextChange() {
    if (this.text) {
      this.textChange.emit(this.text);
    }
  }
}
