import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import type { components } from '../../../generated/models';

// Use the generated MultiImage and Image types
type MultiImage = components["schemas"]["MultiImage"];
type Image = components["schemas"]["Image"];
type MediaType = components["schemas"]["MediaType"];

@Component({
  selector: 'app-content-multi-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './content-multi-image-editor.component.html',
  styleUrls: ['./content-multi-image-editor.component.scss']
})
export class ContentMultiImageEditorComponent {
  @Input() multiImage: MultiImage | undefined;
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
  @Output() multiImageChange = new EventEmitter<MultiImage>();

  mediaTypes: MediaType[] = ['color', 'set', 'uploaded', 'online'];

  onMultiImageChange() {
    if (this.multiImage) {
      this.multiImageChange.emit(this.multiImage);
    }
  }

  addImage() {
    if (this.multiImage && Array.isArray(this.multiImage.images)) {
      this.multiImage.images.push({
        type: 'image',
        setUrl: '',
        mediaType: undefined,
        resolution: '',
        format: '',
        dimensions: { width: undefined, height: undefined, aspectRatio: '' }
      });
      this.onMultiImageChange();
    }
  }

  removeImage(index: number) {
    if (this.multiImage && Array.isArray(this.multiImage.images) && this.multiImage.images.length > 1) {
      this.multiImage.images.splice(index, 1);
      this.onMultiImageChange();
    }
  }
}
