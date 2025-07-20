import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { ContentTemplateImagesFormComponent } from '../content-template-images-form/content-template-images-form.component';
import { ContentTemplateVideoFormComponent } from '../content-template-video-form/content-template-video-form.component';
import type { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-content-item-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ContentTemplateImagesFormComponent, ContentTemplateVideoFormComponent],
  templateUrl: './content-template-content-item-form.component.html',
  styleUrls: ['./content-template-content-item-form.component.scss']
})
export class ContentTemplateContentItemFormComponent {
  @Input() contentItem?: components["schemas"]["ContentItem"];
  @Output() contentItemChange = new EventEmitter<components["schemas"]["ContentItem"]>();

  get contentType(): "text" | "images" | "video" | undefined {
    return this.contentItem?.contentType;
  }

  // ...existing code...

  onContentTypeChange(type: "text" | "images" | "video") {
    let updated: components["schemas"]["ContentItem"] = { ...this.contentItem, contentType: type };
    if (type === 'text') {
      updated.text = { value: '', contentType: 'text' };
      delete updated.imagesTemplate;
      delete updated.videoTemplate;
    } else if (type === 'images') {
      updated.imagesTemplate = {
        imageTemplates: [{
          setUrl: '',
          format: '',
          aspectRatio: 'square',
          mediaType: 'color',
          visualStyleObj: { themes: [{}] }
        }],
        numImages: 1,
        contentType: 'images'
      };
      delete updated.text;
      delete updated.videoTemplate;
    } else if (type === 'video') {
      updated.videoTemplate = {
        setUrl: '',
        format: '',
        aspectRatio: 'square',
        contentType: 'video',
        visualStyleObj: { themes: [{}] }
      };
      delete updated.text;
      delete updated.imagesTemplate;
    }
    this.contentItem = { ...updated };
    this.contentItemChange.emit(this.contentItem);
  }

  // Handler for child emits
  onImagesTemplateChange(imagesTemplate: components["schemas"]["ImagesTemplate"]) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, imagesTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  onVideoTemplateChange(videoTemplate: components["schemas"]["VideoTemplate"]) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, videoTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  // TEXT
  get textValue(): string {
    return this.contentItem?.text?.value ?? '';
  }
  set textValue(value: string) {
    if (this.contentItem) {
      this.contentItem.text = { value, contentType: 'text' };
      this.contentItemChange.emit(this.contentItem);
    }
  }

  // Add a new image template to imagesTemplate
  addImageTemplate() {
    if (!this.contentItem || !this.contentItem.imagesTemplate) return;
    if (!this.contentItem.imagesTemplate.imageTemplates) {
      this.contentItem.imagesTemplate.imageTemplates = [];
    }
    const newImage: components["schemas"]["ImageTemplate"] = {
      setUrl: '',
      format: '',
      aspectRatio: 'square',
      mediaType: undefined // Use correct union type
    };
    this.contentItem.imagesTemplate.imageTemplates.push(newImage);
    this.contentItemChange.emit(this.contentItem);
  }

  // Update a specific image template by index and partial update
  updateImageTemplate(index: number, changes: Partial<components["schemas"]["ImageTemplate"]>) {
    if (!this.contentItem || !this.contentItem.imagesTemplate || !this.contentItem.imagesTemplate.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates;
    if (!imageTemplates || !imageTemplates[index]) return;
    imageTemplates[index] = { ...imageTemplates[index], ...changes };
    this.contentItemChange.emit(this.contentItem);
  }

  // Update theme for a specific image template (stub, adjust as needed)
  updateTheme(index: number, themeIdx: number, changes: any) {
    // Implement theme update logic as needed
    // For now, just emit the change
    this.contentItemChange.emit(this.contentItem);
  }

  // Update video template with partial changes
  updateVideoTemplate(changes: Partial<components["schemas"]["VideoTemplate"]>) {
    if (!this.contentItem || !this.contentItem.videoTemplate) return;
    this.contentItem.videoTemplate = { ...this.contentItem.videoTemplate, ...changes };
    this.contentItemChange.emit(this.contentItem);
  }
}
