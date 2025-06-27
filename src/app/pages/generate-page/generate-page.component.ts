import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavigationService } from '../../services/navigation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlerService } from '../../services/error-handler.service';

// Import generated types
import type { components } from '../../generated/models';

// Use correct generated types
export type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
export type TemplateInfo = components["schemas"]["TemplateInfo"];
export type Platform = components["schemas"]["Platform"];
export type ContentType = components["schemas"]["ContentType"];

// Import the Schedule type and the daysOfWeek union type
type DayOfWeek = components["schemas"]["Schedule"]["daysOfWeek"][number];

// Helper: runtime array of supported platforms (from Platform type)
const SUPPORTED_PLATFORMS: Platform[] = ["instagram", "facebook", "twitter", "tiktok"];
const SUPPORTED_CONTENT_TYPES: ContentType[] = ["text", "image", "multi-image", "video"];

// Patch: Use correct ContentItem type from generated OpenAPI types
export type ContentItem = components["schemas"]["ContentItem"];

// Add ContentItem discriminated union type for clarity
export type ContentItemUnion =
  | ({ type: 'text' } & components["schemas"]["Text"])
  | ({ type: 'image' } & components["schemas"]["Image"])
  | ({ type: 'video' } & components["schemas"]["Video"])
  | ({ type: 'multiImage' } & components["schemas"]["MultiImage"]);

function getDefaultTemplateData(brandId: string = ''): ContentGenerationTemplateDocument {
  // For new templates, do not include id or metadata (backend will generate)
  return {
    // id and metadata will be added by backend, but are required by the type for display
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
      contentItem: { type: 'text', text: { value: '' } } as ContentItem // Default to text type, correct structure
    }
  };
}

@Component({
  selector: 'app-generate-page',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule
  ],
  templateUrl: './generate-page.component.html',
  styleUrl: './generate-page.component.scss'
})
export class GeneratePageComponent implements OnDestroy, OnInit {
  brandId: string | null = null;
  templateId: string | null = null;
  templates: ContentGenerationTemplateDocument[] = [];
  templateData: ContentGenerationTemplateDocument = getDefaultTemplateData();
  loading = false;
  private subscription: any;

  readonly supportedPlatforms = SUPPORTED_PLATFORMS;
  readonly supportedContentTypes = SUPPORTED_CONTENT_TYPES;

  // Helpers for discriminated union
  isTextType(): boolean {
    return this.templateData.settings?.contentItem?.type === 'text';
  }
  isImageType(): boolean {
    return this.templateData.settings?.contentItem?.type === 'image';
  }
  isMultiImageType(): boolean {
    return this.templateData.settings?.contentItem?.type === 'multiImage';
  }
  isVideoType(): boolean {
    return this.templateData.settings?.contentItem?.type === 'video';
  }

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

  // Helper for UI: display capitalized, store lowercase
  // Now typed as DayOfWeek for value
  daysOfWeekOptions: { label: string; value: DayOfWeek }[] = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];

  // 30-minute increment time slots for a 24-hour day
  timeSlotOptions: Array<{ value: string, label: string }> = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    const value = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${displayHour}:${minute === 0 ? '00' : '30'} ${ampm}`;
    return { value, label };
  });

  // Time zone options for schedule
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

  // Add image aspect ratio and format options for UI
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
    private navigationService: NavigationService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlerService
  ) {
    // this.timeSlotOptions = this.generateTimeSlots();
  }

  ngOnInit() {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => {
        this.brandId = id;
        this.templateData.brandId = id || '';
        if (id) {
          this.fetchTemplatesForBrand(id);
        }
      }
    );
  }

  fetchTemplatesForBrand(brandId: string) {
    this.http.get<ContentGenerationTemplateDocument[]>(`/api/content_generation_template_management?brandId=${brandId}`)
      .subscribe(
        (templates) => { this.templates = templates || []; },
        (err) => { this.templates = []; }
      );
  }

  selectTemplate(template: ContentGenerationTemplateDocument) {
    this.templateId = template.id;
    this.http.get<ContentGenerationTemplateDocument>(`/api/content_generation_template_management/${template.id}`)
      .subscribe(
        (fullTemplate) => {
          this.templateData = {
            ...fullTemplate,
            templateInfo: {
              ...fullTemplate.templateInfo,
              contentType: fullTemplate.templateInfo?.contentType || 'text',
              socialAccounts: fullTemplate.templateInfo?.socialAccounts || []
            },
            schedule: {
              daysOfWeek: fullTemplate.schedule?.daysOfWeek || [],
              timeSlots: fullTemplate.schedule?.timeSlots || []
            },
            settings: {
              ...fullTemplate.settings,
              promptTemplate: {
                ...fullTemplate.settings?.promptTemplate,
                variables: (fullTemplate.settings?.promptTemplate?.variables || [])
              },
              visualStyle: fullTemplate.settings?.visualStyle || { themes: [] },
              contentItem: fullTemplate.settings?.contentItem && fullTemplate.settings.contentItem.type
                ? fullTemplate.settings.contentItem
                : { type: 'text', text: { type: 'text', value: '' } }
            }
          };
          this.ensureAtLeastOneMultiImage();
        },
        (err) => {
          this.snackBar.open('Error fetching template details', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          console.error('Fetch template error:', err);
        }
      );
  }

  addVariableValue(event: any, variableIndex: number) {
    const input = event.input;
    const value = event.value;
    const variables = this.templateData.settings?.promptTemplate?.variables;
    if (variables && variables[variableIndex] && Array.isArray(variables[variableIndex].values)) {
      if ((value || '').trim()) {
        variables[variableIndex].values!.push(value.trim());
      }
    }
    if (input) {
      input.value = '';
    }
  }

  removeVariableValue(variableIndex: number, valueIndex: number) {
    const variables = this.templateData.settings?.promptTemplate?.variables;
    if (variables && variables[variableIndex] && Array.isArray(variables[variableIndex].values)) {
      variables[variableIndex].values!.splice(valueIndex, 1);
    }
  }

  updateVariableValues(index: number): void {
    const variables = this.templateData.settings?.promptTemplate?.variables;
    if (!variables || !variables[index] || !Array.isArray(variables[index].values)) return;
    // If you need to parse a string to array, do it in the UI logic, not in the model object
  }

  addTheme() {
    // Ensure settings and visualStyle and themes array exist
    if (!this.templateData.settings) {
      this.templateData.settings = {
        promptTemplate: { userPrompt: '', variables: [] },
        visualStyle: { themes: [] },
        contentItem: { type: 'text', text: { type: 'text', value: '' } }
      };
    }
    if (!this.templateData.settings.visualStyle) {
      this.templateData.settings.visualStyle = { themes: [] };
    }
    if (!Array.isArray(this.templateData.settings.visualStyle && this.templateData.settings.visualStyle.themes)) {
      if (this.templateData.settings.visualStyle) {
        this.templateData.settings.visualStyle.themes = [];
      }
    }
    if (this.templateData.settings.visualStyle && Array.isArray(this.templateData.settings.visualStyle.themes)) {
      this.templateData.settings.visualStyle.themes.push({
        backgroundColor: '',
        textStyle: {
          font: {
            family: '',
            size: '',
            weight: undefined,
            style: undefined,
          },
          alignment: undefined,
        },
        overlayBox: {
          color: '',
          transparency: 1,
          verticalLocation: undefined,
          horizontalLocation: undefined,
        }
      });
    }
  }
  removeTheme(index: number) {
    const visualStyle = this.templateData.settings?.visualStyle;
    if (visualStyle && Array.isArray(visualStyle.themes)) {
      visualStyle.themes.splice(index, 1);
    }
  }

  addVariable() {
    const variables = this.templateData.settings?.promptTemplate?.variables;
    if (variables) {
      variables.push({
        name: '',
        values: []
      });
    }
  }

  removeVariable(index: number) {
    const variables = this.templateData.settings?.promptTemplate?.variables;
    if (variables && variables.length > index) {
      variables.splice(index, 1);
    }
  }

  addTimeSlot() {
    if (!this.templateData.schedule) {
      this.templateData.schedule = { daysOfWeek: [], timeSlots: [] };
    }
    if (!this.templateData.schedule.timeSlots) {
      this.templateData.schedule.timeSlots = [];
    }
    const first = this.timeSlotOptions[0];
    const [hour, minute] = first.value.split(':').map(Number);
    const timezone = this.timeZoneOptions[0];
    this.templateData.schedule.timeSlots.push({ hour, minute, timezone });
  }

  // Fix onTimeSlotChange to use correct property
  onTimeSlotChange(i: number, value: string) {
    const [hour, minute] = value.split(':').map(Number);
    if (this.templateData.schedule?.timeSlots && this.templateData.schedule.timeSlots[i]) {
      this.templateData.schedule.timeSlots[i].hour = hour;
      this.templateData.schedule.timeSlots[i].minute = minute;
    }
  }

  removeTimeSlot(index: number) {
    if (this.templateData.schedule?.timeSlots) {
      this.templateData.schedule.timeSlots.splice(index, 1);
    }
  }

  toggleDayOfWeek(day: string, checked: boolean) {
    if (!this.templateData.schedule) {
      this.templateData.schedule = { daysOfWeek: [], timeSlots: [] };
    }
    if (!this.templateData.schedule.daysOfWeek) {
      this.templateData.schedule.daysOfWeek = [];
    }
    const dayValue = this.daysOfWeekOptions.find(d => d.label === day)?.value || day.toLowerCase();
    const idx = this.templateData.schedule.daysOfWeek.indexOf(dayValue as any);
    if (checked && idx === -1) {
      this.templateData.schedule.daysOfWeek.push(dayValue as any);
    } else if (!checked && idx !== -1) {
      this.templateData.schedule.daysOfWeek.splice(idx, 1);
    }
  }

  togglePlatform(platform: Platform, checked: boolean) {
    if (!this.templateData.templateInfo) return;
    if (!this.templateData.templateInfo.socialAccounts) {
      this.templateData.templateInfo.socialAccounts = [];
    }
    const accounts = this.templateData.templateInfo.socialAccounts;
    const idx = accounts.indexOf(platform);
    if (checked && idx === -1) {
      accounts.push(platform);
    } else if (!checked && idx !== -1) {
      accounts.splice(idx, 1);
    }
  }

  // Map display values to backend enum values
  mapContentType(input: string): string {
    const normalized = input.toLowerCase().replace(/ /g, '-');
    switch (normalized) {
      case 'text':
      case 'video':
      case 'multi-image':
      case 'image':
        return normalized;
      default:
        throw new Error(`Unknown content type: ${input}`);
    }
  }

  onSubmit() {
    this.loading = true;
    (this.templateData.settings?.promptTemplate?.variables || []).forEach((v: any, i: number) => this.updateVariableValues(i));
    // Prepare payload for backend: remove id and metadata, and remove systemPrompt, model, temperature, maxTokens
    const { id, metadata, ...rest } = this.templateData;
    const { systemPrompt, model, temperature, maxTokens, ...promptTemplateRest } = this.templateData.settings?.promptTemplate || {};
    const payload: any = {
      ...rest,
      templateInfo: {
        ...this.templateData.templateInfo,
        socialAccounts: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo?.description || ''
      },
      settings: {
        ...this.templateData.settings,
        promptTemplate: {
          ...promptTemplateRest,
          variables: (this.templateData.settings?.promptTemplate?.variables || []).map((v: any) => ({
            name: v.name,
            values: v.values
          }))
        }
      }
    };
    // Debug log for outgoing payload
    console.log('Submitting template data:', payload);
    const url = `/api/content_generation_template_management`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Template created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.createNewTemplate();
        if (this.brandId) this.fetchTemplatesForBrand(this.brandId);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Error creating template', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.errorHandler.handleError(err);
      }
    });
  }

  onUpdate() {
    if (!this.templateId) return;
    this.loading = true;
    (this.templateData.settings?.promptTemplate?.variables || []).forEach((v: any, i: number) => this.updateVariableValues(i));
    // Prepare payload for backend: remove id and metadata, and remove systemPrompt, model, temperature, maxTokens
    const { id, metadata, ...rest } = this.templateData;
    const { systemPrompt, model, temperature, maxTokens, ...promptTemplateRest } = this.templateData.settings?.promptTemplate || {};
    const payload: any = {
      ...rest,
      templateInfo: {
        ...this.templateData.templateInfo,
        socialAccounts: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo?.description || ''
      },
      settings: {
        ...this.templateData.settings,
        promptTemplate: {
          ...promptTemplateRest,
          variables: (this.templateData.settings?.promptTemplate?.variables || []).map((v: any) => ({
            name: v.name,
            values: v.values
          }))
        }
      }
    };
    // Debug log for outgoing payload
    console.log('Updating template data:', payload);
    const url = `/api/content_generation_template_management/${this.templateId}`;
    this.http.put(url, payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Template updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        if (this.brandId) this.fetchTemplatesForBrand(this.brandId);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Error updating template', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.errorHandler.handleError(err);
      }
    });
  }

  createNewTemplate() {
    this.templateId = null;
    this.templateData = getDefaultTemplateData(this.brandId || '');
  }

  onCancel() {
    this.templateId = null;
    this.createNewTemplate();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  // Ensure getSelectedPlatforms and updateVariableValues exist and are typed
  getSelectedPlatforms(): Platform[] {
    return this.templateData.templateInfo?.socialAccounts || [];
  }

  // Helper to get the string value for a time slot (for binding)
  slotString(i: number): string {
    if (!this.templateData.schedule || !this.templateData.schedule.timeSlots) return '';
    const slot = this.templateData.schedule.timeSlots[i];
    if (!slot) return '';
    const hour = slot.hour?.toString().padStart(2, '0') ?? '00';
    const minute = slot.minute?.toString().padStart(2, '0') ?? '00';
    return `${hour}:${minute}`;
  }

  // Helper to get or initialize the image object for form input only (no actual image data or preview)
  get image() {
    // Always return a valid Image object or a default
    if (!this.templateData.settings) {
      this.templateData.settings = {
        promptTemplate: { userPrompt: '', variables: [] },
        visualStyle: { themes: [] },
        contentItem: { type: 'image', image: { type: 'image', setUrl: '', mediaType: undefined, resolution: '', format: '', dimensions: { width: undefined, height: undefined, aspectRatio: '' } } }
      };
    }
    if (!this.templateData.settings.contentItem || typeof this.templateData.settings.contentItem !== 'object') {
      this.templateData.settings.contentItem = { type: 'image', image: { type: 'image', setUrl: '', mediaType: undefined, resolution: '', format: '', dimensions: { width: undefined, height: undefined, aspectRatio: '' } } };
    }
    if (!('image' in this.templateData.settings.contentItem) || !this.templateData.settings.contentItem.image) {
      this.templateData.settings.contentItem = { type: 'image', image: { type: 'image', setUrl: '', mediaType: undefined, resolution: '', format: '', dimensions: { width: undefined, height: undefined, aspectRatio: '' } } };
    }
    return this.templateData.settings.contentItem.image;
  }

  get imageDimensions() {
    const img = this.image;
    if (img && !img.dimensions) {
      img.dimensions = { width: undefined, height: undefined, aspectRatio: '' };
    }
    return img ? img.dimensions : { width: undefined, height: undefined, aspectRatio: '' };
  }

  addMultiImage() {
    const contentItem = this.templateData.settings?.contentItem;
    if (contentItem?.type === 'multiImage' && contentItem.multiImage) {
      if (!Array.isArray(contentItem.multiImage.images)) {
        contentItem.multiImage.images = [];
      }
      contentItem.multiImage.images.push({
        type: 'image',
        setUrl: '',
        mediaType: undefined,
        resolution: '',
        format: '',
        dimensions: { width: undefined, height: undefined, aspectRatio: '' }
      });
    }
  }

  removeMultiImage(index: number) {
    const contentItem = this.templateData.settings?.contentItem;
    if (contentItem?.type === 'multiImage' && contentItem.multiImage && Array.isArray(contentItem.multiImage.images)) {
      if (contentItem.multiImage.images.length > 1) {
        contentItem.multiImage.images.splice(index, 1);
      }
    }
  }

  // Patch setContentItemDefaults to always ensure at least one image for multiImage
  setContentItemDefaults(contentType: string) {
    if (!this.templateData.settings) {
      this.templateData.settings = {
        promptTemplate: { userPrompt: '', variables: [] },
        visualStyle: { themes: [] },
        contentItem: { type: 'text', text: { type: 'text', value: '' } }
      };
    }
    const settings = this.templateData.settings;
    if (!settings) return;
    if (contentType === 'multi-image' || contentType === 'multiImage') {
      settings.contentItem = {
        type: 'multiImage',
        multiImage: { type: 'multiImage', minImages: 1, maxImages: 5, images: [] }
      };
      this.ensureAtLeastOneMultiImage();
    } else if (contentType === 'video') {
      settings.contentItem = {
        type: 'video',
        video: {
          type: 'video',
          setUrl: '',
          mediaType: undefined,
          resolution: '',
          format: '',
          dimensions: { width: undefined, height: undefined, aspectRatio: '' },
          videoInfo: { duration: undefined, frameRate: undefined, codec: '' },
          audioInfo: { audioCodec: '', channels: undefined }
        }
      };
    } else if (contentType === 'image') {
      settings.contentItem = {
        type: 'image',
        image: {
          type: 'image',
          setUrl: '',
          mediaType: undefined,
          resolution: '',
          format: '',
          dimensions: { width: undefined, height: undefined, aspectRatio: '' }
        }
      };
    } else {
      // Default to text
      settings.contentItem = {
        type: 'text',
        text: { type: 'text', value: '' }
      };
    }
  }

  ensureAtLeastOneMultiImage() {
    const contentItem = this.templateData.settings?.contentItem;
    if (contentItem?.type === 'multiImage' && contentItem.multiImage) {
      if (!Array.isArray(contentItem.multiImage.images)) {
        contentItem.multiImage.images = [];
      }
      if (contentItem.multiImage.images.length === 0) {
        contentItem.multiImage.images.push({
          type: 'image',
          setUrl: '',
          mediaType: undefined,
          resolution: '',
          format: '',
          dimensions: { width: undefined, height: undefined, aspectRatio: '' }
        });
      }
    }
  }
}
