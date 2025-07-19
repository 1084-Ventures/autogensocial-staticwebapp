import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-content-item-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-content-item-form.component.html',
  styleUrls: ['./content-template-content-item-form.component.scss']
})
export class ContentTemplateContentItemFormComponent {
  @Input() contentItem: components["schemas"]["ContentItem"] | undefined;
  @Output() contentItemChange = new EventEmitter<components["schemas"]["ContentItem"]>();

  get contentType(): "text" | "images" | "video" | undefined {
    return this.contentItem?.contentType;
  }

  get textValue(): string {
    return this.contentItem?.text?.value || '';
  }
  set textValue(value: string) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, text: { value, contentType: "text" } };
    this.contentItemChange.emit(this.contentItem);
  }

  onImagesTemplateChange(imagesTemplate: any) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, imagesTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  onVideoTemplateChange(videoTemplate: any) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, videoTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  onContentTypeChange(type: "text" | "images" | "video") {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, contentType: type };
    this.contentItemChange.emit(this.contentItem);
  }
}
