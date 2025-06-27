import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import type { components } from '../../../generated/models';

// Use the generated Image type
type Image = components["schemas"]["Image"];

type MediaType = components["schemas"]["MediaType"];

@Component({
  selector: 'app-content-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './content-image-editor.component.html',
  styleUrls: ['./content-image-editor.component.scss']
})
export class ContentImageEditorComponent {
  @Input() image: Image | undefined;
  @Input() imageFormats: { value: string; label: string }[] = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'gif', label: 'GIF' }
  ];
  @Input() aspectRatios: { value: string; label: string }[] = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '4:5', label: '4:5 (Portrait)' },
    { value: '9:16', label: '9:16 (Story)' }
  ];
  @Output() imageChange = new EventEmitter<Image>();

  mediaTypes: MediaType[] = ['color', 'set', 'uploaded', 'online'];

  onImageChange() {
    if (this.image) {
      this.imageChange.emit(this.image);
    }
  }
}
