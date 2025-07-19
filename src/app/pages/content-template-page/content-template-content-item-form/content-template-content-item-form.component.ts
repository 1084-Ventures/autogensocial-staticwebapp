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
  get contentType(): "text" | "images" | "video" | undefined {
    return this.contentItem?.contentType;
  }
  updateThemeFontFamily(imageIdx: number, themeIdx: number, value: string): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img, i) => {
      if (i === imageIdx && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.map((theme, t) => {
          if (t === themeIdx) {
            const newTheme = { ...theme };
            if (!newTheme.textStyle) newTheme.textStyle = { font: { family: '', size: '', weight: 'normal', style: 'normal', color: '' }, outline: { color: '', width: 0 }, alignment: 'left', transparency: 1 };
            if (!newTheme.textStyle.font) newTheme.textStyle.font = { family: '', size: '', weight: 'normal', style: 'normal', color: '' };
            newTheme.textStyle.font.family = value;
            return newTheme;
          }
          return theme;
        });
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  updateThemeFontSize(imageIdx: number, themeIdx: number, value: string): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img, i) => {
      if (i === imageIdx && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.map((theme, t) => {
          if (t === themeIdx) {
            const newTheme = { ...theme };
            if (!newTheme.textStyle) newTheme.textStyle = { font: { family: '', size: '', weight: 'normal', style: 'normal', color: '' }, outline: { color: '', width: 0 }, alignment: 'left', transparency: 1 };
            if (!newTheme.textStyle.font) newTheme.textStyle.font = { family: '', size: '', weight: 'normal', style: 'normal', color: '' };
            newTheme.textStyle.font.size = value;
            return newTheme;
          }
          return theme;
        });
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  updateThemeFontColor(imageIdx: number, themeIdx: number, value: string): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img, i) => {
      if (i === imageIdx && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.map((theme, t) => {
          if (t === themeIdx) {
            const newTheme = { ...theme };
            if (!newTheme.textStyle) newTheme.textStyle = { font: { family: '', size: '', weight: 'normal', style: 'normal', color: '' }, outline: { color: '', width: 0 }, alignment: 'left', transparency: 1 };
            if (!newTheme.textStyle.font) newTheme.textStyle.font = { family: '', size: '', weight: 'normal', style: 'normal', color: '' };
            newTheme.textStyle.font.color = value;
            return newTheme;
          }
          return theme;
        });
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  updateThemeOverlayColor(imageIdx: number, themeIdx: number, value: string): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img, i) => {
      if (i === imageIdx && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.map((theme, t) => {
          if (t === themeIdx) {
            const newTheme = { ...theme };
            if (!newTheme.overlayBox) newTheme.overlayBox = { color: '', transparency: 0, verticalLocation: 'top', horizontalLocation: 'left' };
            newTheme.overlayBox.color = value;
            return newTheme;
          }
          return theme;
        });
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }
  @Input() contentItem: components["schemas"]["ContentItem"] | undefined;
  @Output() contentItemChange = new EventEmitter<components["schemas"]["ContentItem"]>();

  onImagesTemplateChange(imagesTemplate: components["schemas"]["ImagesTemplate"]) {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, imagesTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  addImageTemplate(): void {
    if (!this.contentItem?.imagesTemplate) return;
    const newImageTemplate: components["schemas"]["ImageTemplate"] = {
      mediaType: 'color', // enum: "color" | "set" | "uploaded" | "online"
      setUrl: '',
      visualStyleObj: { themes: [this.createDefaultTheme()] },
      aspectRatio: 'square', // enum: "square" | "portrait" | "landscape" | "story"
      format: '',
    };
    const imageTemplates = [...(this.contentItem.imagesTemplate.imageTemplates || []), newImageTemplate];
    const imagesTemplate: components["schemas"]["ImagesTemplate"] = {
      ...this.contentItem.imagesTemplate,
      imageTemplates,
      contentType: 'images',
    };
    this.onImagesTemplateChange(imagesTemplate);
  }

  removeImageTemplate(index: number): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.filter((_: any, i: number) => i !== index);
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  addTheme(imageIndex: number): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img: components["schemas"]["ImageTemplate"], i: number) => {
      if (i === imageIndex) {
        const themes = [...(img.visualStyleObj?.themes || []), this.createDefaultTheme()];
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  removeTheme(imageIndex: number, themeIndex: number): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img: components["schemas"]["ImageTemplate"], i: number) => {
      if (i === imageIndex && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.filter((_: any, t: number) => t !== themeIndex);
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  updateTheme(imageIndex: number, themeIndex: number, changes: Partial<components["schemas"]["VisualStyle"]>): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img: components["schemas"]["ImageTemplate"], i: number) => {
      if (i === imageIndex && img.visualStyleObj?.themes) {
        const themes = img.visualStyleObj.themes.map((theme: components["schemas"]["VisualStyle"], t: number) => t === themeIndex ? { ...theme, ...changes } : theme);
        return { ...img, visualStyleObj: { ...img.visualStyleObj, themes } };
      }
      return img;
    });
    const imagesTemplate = { ...this.contentItem.imagesTemplate, imageTemplates };
    this.onImagesTemplateChange(imagesTemplate);
  }

  createDefaultTheme(): components["schemas"]["VisualStyle"] {
    return {
      textStyle: {
        font: {
          family: '',
          size: '',
          weight: 'normal',
          style: 'normal',
          color: ''
        },
        outline: {
          color: '',
          width: 0
        },
        alignment: 'left',
        transparency: 1,
      },
      overlayBox: {
        color: '',
        transparency: 0,
        verticalLocation: 'top',
        horizontalLocation: 'left',
      },
      // Only include backgroundColor if mediaType is 'color' in parent
      // backgroundColor: '',
    };
  }

  get textValue(): string {
    return this.contentItem?.text?.value || '';
  }
  set textValue(value: string) {
    if (!this.contentItem) return;
    const text = { ...this.contentItem.text, value, contentType: 'text' as const };
    this.updateText(text);
  }

  updateText(text: components["schemas"]["Text"]): void {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, text };
    this.contentItemChange.emit(this.contentItem);
  }

  updateVideoTemplate(changes: Partial<components["schemas"]["VideoTemplate"]>): void {
    if (!this.contentItem?.videoTemplate) return;
    const videoTemplate: components["schemas"]["VideoTemplate"] = {
      ...this.contentItem.videoTemplate,
      ...changes,
      contentType: 'video',
    };
    this.contentItem = { ...this.contentItem, videoTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  onVideoTemplateChange(videoTemplate: components["schemas"]["VideoTemplate"]): void {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, videoTemplate };
    this.contentItemChange.emit(this.contentItem);
  }

  onContentTypeChange(type: "text" | "images" | "video"): void {
    if (!this.contentItem) return;
    this.contentItem = { ...this.contentItem, contentType: type };
    this.contentItemChange.emit(this.contentItem);
  }

  updateImageTemplate(index: number, changes: Partial<components["schemas"]["ImageTemplate"]>): void {
    if (!this.contentItem?.imagesTemplate?.imageTemplates) return;
    const imageTemplates = this.contentItem.imagesTemplate.imageTemplates.map((img: components["schemas"]["ImageTemplate"], i: number) =>
      i === index ? { ...img, ...changes } : img
    );
    const imagesTemplate: components["schemas"]["ImagesTemplate"] = {
      ...this.contentItem.imagesTemplate,
      imageTemplates,
      contentType: 'images',
    };
    this.onImagesTemplateChange(imagesTemplate);
  }

  updateNumImages(num: number): void {
    if (!this.contentItem?.imagesTemplate) return;
    const imagesTemplate: components["schemas"]["ImagesTemplate"] = {
      ...this.contentItem.imagesTemplate,
      numImages: num,
      contentType: 'images',
    };
    this.onImagesTemplateChange(imagesTemplate);
  }
}
