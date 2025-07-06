import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { ContentImageEditorComponent } from '../content-template-page-components/content-image-editor/content-image-editor.component';
import { ContentMultiImageEditorComponent } from '../content-template-page-components/content-multi-image-editor/content-multi-image-editor.component';
import { ContentVideoEditorComponent } from '../content-template-page-components/content-video-editor/content-video-editor.component';
import { TemplateInfoEditorComponent } from '../content-template-page-components/template-info-editor/template-info-editor.component';
import { ScheduleEditorComponent } from '../content-template-page-components/schedule-editor/schedule-editor.component';
import { PromptTemplateEditorComponent } from '../content-template-page-components/prompt-template-editor/prompt-template-editor.component';
import { VisualStyleEditorComponent } from '../content-template-page-components/visual-style-editor/visual-style-editor.component';
import { ContentItemEditorComponent } from '../content-template-page-components/content-item-editor/content-item-editor.component';
import { HttpClient } from '@angular/common/http';
import type { components } from '../../../generated/models';

export type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
export type TemplateInfo = components["schemas"]["TemplateInfo"];
export type Platform = components["schemas"]["Platform"];
export type ContentType = components["schemas"]["ContentType"];
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
const SUPPORTED_PLATFORMS: Platform[] = ["instagram", "facebook", "twitter", "tiktok"];
const SUPPORTED_CONTENT_TYPES: ContentType[] = ["text", "image", "multi-image", "video"];
export type ContentItem = components["schemas"]["ContentItem"];
export type ContentItemUnion =
  | ({ type: 'text' } & components["schemas"]["Text"])
  | ({ type: 'image' } & components["schemas"]["Image"])
  | ({ type: 'video' } & components["schemas"]["Video"])
  | ({ type: 'multiImage' } & components["schemas"]["MultiImage"]);

function getDefaultTemplateData(brandId: string = ''): ContentGenerationTemplateDocument {
  return {
    id: '',
    metadata: {
      createdDate: '',
      updatedDate: '',
      isActive: true
    },
    brandId,
    templateInfo: {
      name: '',
      description: '',
      contentType: 'text',
      socialAccounts: []
    },
    schedule: {
      daysOfWeek: [],
      timeSlots: []
    },
    settings: {
      promptTemplate: {
        userPrompt: '',
        variables: []
      },
      visualStyle: {
        themes: []
      },
      contentItem: { type: 'text', text: { type: 'text', value: '' } } as ContentItem
    }
  };
}

@Component({
  selector: 'app-content-template-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MaterialModule,
    TemplateInfoEditorComponent, ScheduleEditorComponent, PromptTemplateEditorComponent, VisualStyleEditorComponent, ContentItemEditorComponent
  ],
  templateUrl: './content-template-page.component.html',
  styleUrls: ['./content-template-page.component.scss']
})
export class ContentTemplatePageComponent implements OnDestroy, OnInit {
  brandId: string | null = null;
  templateId: string | null = null;
  templates: Array<ContentGenerationTemplateDocument> = [];
  templateData: ContentGenerationTemplateDocument = getDefaultTemplateData();
  loading: boolean = false;
  private subscription: any;
  readonly supportedPlatforms = SUPPORTED_PLATFORMS;
  readonly supportedContentTypes = SUPPORTED_CONTENT_TYPES;
  fontOptions: Array<{ label: string; value: string }> = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Arial Narrow', value: 'Arial Narrow' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Verdana', value: 'Verdana' }
  ];
  daysOfWeekOptions: Array<{ label: string; value: DayOfWeek }> = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];
  timeSlotOptions: Array<{ value: string; label: string }> = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    const value = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${displayHour}:${minute === 0 ? '00' : '30'} ${ampm}`;
    return { value, label };
  });
  timeZoneOptions: string[] = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney', 'America/Sao_Paulo', 'Africa/Johannesburg', 'Asia/Dubai'
  ];
  materialColors: Array<{ name: string; value: string } | { label: string; value: string }> = [
    { name: 'Red', value: '#F44336' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Deep Purple', value: '#673AB7' },
    { name: 'Indigo', value: '#3F51B5' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Light Blue', value: '#03A9F4' },
    { name: 'Cyan', value: '#00BCD4' },
    { name: 'Teal', value: '#009688' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Light Green', value: '#8BC34A' },
    { name: 'Lime', value: '#CDDC39' },
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Amber', value: '#FFC107' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Deep Orange', value: '#FF5722' },
    { name: 'Brown', value: '#795548' },
    { name: 'Grey', value: '#9E9E9E' },
    { name: 'Blue Grey', value: '#607D8B' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { label: 'GIF', value: 'gif' }
  ];
  imageAspectRatios: Array<{ label: string; value: string }> = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '4:5 (Portrait)', value: '4:5' },
    { label: '16:9 (Landscape)', value: '16:9' },
    { label: '9:16 (Story)', value: '9:16' }
  ];
  imageFormats: Array<{ label: string; value: string }> = [
    { label: 'JPEG', value: 'jpeg' },
    { label: 'PNG', value: 'png' },
    { label: 'WEBP', value: 'webp' },
    { label: 'GIF', value: 'gif' }
  ];

  constructor() {}

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  createNewTemplate(): void {
    const newTemplate = getDefaultTemplateData(this.brandId || '');
    newTemplate.id = 'new-' + (Date.now());
    this.templates = [...this.templates, newTemplate];
    this.templateId = newTemplate.id;
    this.templateData = newTemplate;
  }

  selectTemplate(t: ContentGenerationTemplateDocument): void {
    this.templateId = t.id;
    this.templateData = t;
  }

  // Handlers for atomic editors
  onTemplateInfoChange(info: TemplateInfo) {
    this.templateData.templateInfo = { ...info };
  }
  onScheduleChange(schedule: components["schemas"]["Schedule"]) {
    this.templateData.schedule = { ...schedule };
  }
  onPromptTemplateChange(prompt: components["schemas"]["PromptTemplate"]) {
    if (!this.templateData.settings) this.templateData.settings = {} as any;
    this.templateData.settings!.promptTemplate = { ...prompt };
  }
  onVisualStyleChange(style: components["schemas"]["VisualStyleObj"]) {
    if (!this.templateData.settings) this.templateData.settings = {} as any;
    this.templateData.settings!.visualStyle = { ...style };
  }
  onContentItemChange(item: ContentItem) {
    if (!this.templateData.settings) this.templateData.settings = {} as any;
    this.templateData.settings!.contentItem = { ...item };
  }
}
