import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { ContentTemplateVisualStyleFormComponent } from '../content-template-visual-style-form/content-template-visual-style-form.component';
import type { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-video-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ContentTemplateVisualStyleFormComponent],
  templateUrl: './content-template-video-form.component.html',
  styleUrls: ['./content-template-video-form.component.scss']
})
export class ContentTemplateVideoFormComponent implements OnChanges {
  /**
   * Accepts a VideoTemplate object from parent (ContentItemForm)
   * Emits changes to parent when videoTemplate is updated
   */
  @Input() videoTemplate?: components["schemas"]["VideoTemplate"];
  @Output() videoTemplateChange = new EventEmitter<components["schemas"]["VideoTemplate"]>();

  /**
   * Handles changes from the child visual style form
   */
  onVisualStyleChange(newStyle: components["schemas"]["VisualStyle"]) {
    if (!this.videoTemplate) return;
    const visualStyleObj = this.videoTemplate.visualStyleObj || { themes: [{}] };
    const updatedThemes = [...(visualStyleObj.themes || [{}])];
    updatedThemes[0] = newStyle;
    this.updateVideoTemplate({
      visualStyleObj: { themes: updatedThemes }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Ensure videoTemplate is always in correct format
    if (changes['videoTemplate'] && this.videoTemplate) {
      this.videoTemplate = this.sanitizeVideoTemplate(this.videoTemplate);
    }
  }

  updateVideoTemplate(changes: Partial<components["schemas"]["VideoTemplate"]>) {
    if (!this.videoTemplate) return;
    // Only allow keys that exist in VideoTemplate schema
    const allowedKeys: (keyof components["schemas"]["VideoTemplate"])[] = [
      'setUrl', 'format', 'aspectRatio', 'mediaType', 'visualStyleObj'
    ];
    const filteredChanges = Object.keys(changes)
      .filter(key => allowedKeys.includes(key as keyof components["schemas"]["VideoTemplate"]))
      .reduce((obj, key) => {
        const value = changes[key as keyof components["schemas"]["VideoTemplate"]];
        // Only assign if type matches VideoTemplate model and property is not strictly undefined
        switch (key) {
          case 'setUrl':
          case 'format':
          case 'aspectRatio':
          case 'mediaType':
            if (typeof value === 'undefined') {
              obj[key] = undefined;
            }
            // If the schema only allows undefined, skip assignment for string values
            break;
          case 'visualStyleObj':
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              obj[key] = value;
            }
            break;
          default:
            // Do not assign if property type is strictly undefined
            break;
        }
        return obj;
      }, {} as Partial<components["schemas"]["VideoTemplate"]>);
    this.videoTemplate = { ...this.videoTemplate, ...filteredChanges };
    this.videoTemplateChange.emit(this.sanitizeVideoTemplate(this.videoTemplate));
  }

  /**
   * Ensures the videoTemplate object matches the VideoTemplate schema
   * Always sets contentType: "video" as required by the model
   * Handles null/undefined for visualStyleObj and other fields
   */
  sanitizeVideoTemplate(template: components["schemas"]["VideoTemplate"]): components["schemas"]["VideoTemplate"] {
    return {
      contentType: "video",
      setUrl: template.setUrl !== undefined ? template.setUrl : undefined,
      format: template.format !== undefined ? template.format : undefined,
      aspectRatio: template.aspectRatio !== undefined ? template.aspectRatio : undefined,
      mediaType: template.mediaType !== undefined ? template.mediaType : undefined,
      visualStyleObj: template.visualStyleObj !== undefined ? template.visualStyleObj : undefined
    };
  }
}
