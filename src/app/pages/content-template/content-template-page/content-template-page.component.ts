import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { ContentImageEditorComponent } from '../content-template-page-components/content-image-editor/content-image-editor.component';
import { ContentMultiImageEditorComponent } from '../content-template-page-components/content-multi-image-editor/content-multi-image-editor.component';
import { ContentVideoEditorComponent } from '../content-template-page-components/content-video-editor/content-video-editor.component';
import { HttpClient } from '@angular/common/http';

// TODO: Restore strong typing when generated models are available
export type ContentGenerationTemplateDocument = any;
export type TemplateInfo = any;
export type Platform = string;
export type ContentType = string;
type DayOfWeek = string;
const SUPPORTED_PLATFORMS: Platform[] = ["instagram", "facebook", "twitter", "tiktok"];
const SUPPORTED_CONTENT_TYPES: ContentType[] = ["text", "image", "multi-image", "video"];
export type ContentItem = any;
export type ContentItemUnion = any;
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
      contentItem: { type: 'text', text: { value: '' } }
    }
  };
}

@Component({
  selector: 'app-content-template-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, ContentImageEditorComponent, ContentMultiImageEditorComponent, ContentVideoEditorComponent],
  templateUrl: './content-template-page.component.html',
  styleUrls: ['./content-template-page.component.scss']
})
export class ContentTemplatePageComponent implements OnDestroy, OnInit {
  brandId: string | null = null;
  templateId: string | null = null;
  templates: ContentGenerationTemplateDocument[] = [];
  templateData: ContentGenerationTemplateDocument = getDefaultTemplateData();
  loading = false;
  private subscription: any;
  readonly supportedPlatforms = SUPPORTED_PLATFORMS;
  readonly supportedContentTypes = SUPPORTED_CONTENT_TYPES;
  fontOptions = [
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
  daysOfWeekOptions: { label: string; value: DayOfWeek }[] = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];
  timeSlotOptions: Array<{ value: string, label: string }> = Array.from({ length: 48 }, (_, i) => {
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
  materialColors = [
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
    { name: 'Black', value: '#000000' }
  ];
  imageAspectRatios = [
    { label: '1:1 (Square)', value: '1:1' },
    { label: '4:5 (Portrait)', value: '4:5' },
    { label: '16:9 (Landscape)', value: '16:9' },
    { label: '9:16 (Story)', value: '9:16' }
  ];
  imageFormats = [
    { label: 'JPEG', value: 'jpeg' },
    { label: 'PNG', value: 'png' },
    { label: 'WEBP', value: 'webp' },
    { label: 'GIF', value: 'gif' }
  ];
  constructor(
    // private navigationService: NavigationService,
    // private http: HttpClient,
    // private snackBar: MatSnackBar,
    // private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    // Stubbed: navigationService and brand logic removed
    // TODO: Restore brand logic when NavigationService is available
  }

  ngOnDestroy(): void {
    // Stubbed: subscription logic removed
  }

  // Stubbed: fetchTemplatesForBrand and other service/model-dependent methods removed
  // TODO: Restore these methods when services/models are available

  // Minimal stub for template creation
  createNewTemplate(): void {
    // Add a new blank template to the list and select it
    const newTemplate = getDefaultTemplateData(this.brandId || '');
    newTemplate.id = 'new-' + (Date.now());
    this.templates = [...this.templates, newTemplate];
    this.templateId = newTemplate.id;
    this.templateData = newTemplate;
  }

  // Minimal stub for template selection
  selectTemplate(t: any): void {
    this.templateId = t.id;
    this.templateData = t;
  }
}
