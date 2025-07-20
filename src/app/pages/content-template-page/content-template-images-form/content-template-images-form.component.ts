import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { ContentTemplateVisualStyleFormComponent } from '../content-template-visual-style-form/content-template-visual-style-form.component';
import type { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-images-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ContentTemplateVisualStyleFormComponent],
  templateUrl: './content-template-images-form.component.html',
  styleUrls: ['./content-template-images-form.component.scss']
})
export class ContentTemplateImagesFormComponent {
  private _imagesTemplate?: components["schemas"]["ImagesTemplate"];
  @Input()
  set imagesTemplate(value: components["schemas"]["ImagesTemplate"] | undefined) {
    if (value) {
      this._imagesTemplate = value;
    } else {
      this._imagesTemplate = {
        imageTemplates: [],
        numImages: 1,
        contentType: 'images'
      };
    }
    this.ensureImageTemplatesLength();
  }
  ngOnChanges() {
    this.ensureImageTemplatesLength();
  }

  private sanitizeVisualStyleObj(obj: any): components["schemas"]["VisualStyle"] {
    if (!obj || typeof obj !== 'object') return {};
    // Only keep textStyle property for images
    const { textStyle } = obj;
    const result: components["schemas"]["VisualStyle"] = {};
    if (textStyle) result.textStyle = textStyle;
    return result;
  }

  private ensureImageTemplatesLength() {
    if (!this._imagesTemplate) return;
    const num = this._imagesTemplate.numImages ?? 1;
    if (!Array.isArray(this._imagesTemplate.imageTemplates)) {
      this._imagesTemplate.imageTemplates = [];
    }
    while (this._imagesTemplate.imageTemplates.length < num) {
      this._imagesTemplate.imageTemplates.push({
        setUrl: '',
        format: '',
        aspectRatio: 'square',
        mediaType: 'color',
        visualStyleObj: { themes: [{}] } // always initialize as themes array
      });
    }
    if (this._imagesTemplate.imageTemplates.length > num) {
      this._imagesTemplate.imageTemplates.length = num;
    }
    // No need to sanitize visualStyleObj; let child form handle initialization
  }

  onNumImagesEnter() {
    this.ensureImageTemplatesLength();
    this.imagesTemplateChange.emit(this.imagesTemplate);
  }
  get imagesTemplate(): components["schemas"]["ImagesTemplate"] {
    return this._imagesTemplate!;
  }
  @Output() imagesTemplateChange = new EventEmitter<components["schemas"]["ImagesTemplate"]>();

  addImageTemplate() {
    if (!this.imagesTemplate.imageTemplates) {
      this.imagesTemplate.imageTemplates = [];
    }
    const newImage: components["schemas"]["ImageTemplate"] = {
      setUrl: '',
      format: '',
      aspectRatio: 'square',
      mediaType: 'color', // default to 'color' as per model
      visualStyleObj: undefined // handled by visual style form
    };
    this.imagesTemplate.imageTemplates.push(newImage);
    this.imagesTemplateChange.emit(this.imagesTemplate);
  }

  updateImageTemplate(index: number, changes: Partial<components["schemas"]["ImageTemplate"]>) {
    if (!this.imagesTemplate.imageTemplates) return;
    const imageTemplates = this.imagesTemplate.imageTemplates;
    if (!imageTemplates[index]) return;
    // No need to wrap visualStyleObj here, handled in template
    imageTemplates[index] = { ...imageTemplates[index], ...changes };
    this.imagesTemplateChange.emit(this.imagesTemplate);
    this.ensureImageTemplatesLength();
  }
}
