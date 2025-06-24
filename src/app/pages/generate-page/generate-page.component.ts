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

// Import the Schedule type and the days_of_week union type
type DayOfWeek = components["schemas"]["Schedule"]["days_of_week"][number];

// Helper: runtime array of supported platforms (from Platform type)
const SUPPORTED_PLATFORMS: Platform[] = ["instagram", "facebook", "twitter", "tiktok"];
const SUPPORTED_CONTENT_TYPES: ContentType[] = ["text", "image", "multi_image", "video"];

function getDefaultTemplateData(brandId: string = ''): ContentGenerationTemplateDocument {
  return {
    id: '',
    metadata: {
      created_date: '',
      updated_date: '',
      is_active: true
    },
    brandId,
    templateInfo: {
      name: '',
      description: '',
      contentType: 'text', // must match the ContentType union
      socialAccounts: []
    },
    schedule: {
      days_of_week: [],
      time_slots: []
    },
    settings: {
      prompt_template: {
        system_prompt: '',
        user_prompt: '',
        model: '',
        temperature: 1,
        max_tokens: 256,
        variables: []
      },
      visual_style: {
        themes: []
      },
      contentItem: {}
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
              days_of_week: fullTemplate.schedule?.days_of_week || [],
              time_slots: fullTemplate.schedule?.time_slots || []
            },
            settings: {
              ...fullTemplate.settings,
              prompt_template: {
                ...fullTemplate.settings?.prompt_template,
                variables: (fullTemplate.settings?.prompt_template?.variables || [])
              },
              visual_style: fullTemplate.settings?.visual_style || { themes: [] },
              contentItem: fullTemplate.settings?.contentItem || {}
            }
          };
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
    const variables = this.templateData.settings?.prompt_template?.variables;
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
    const variables = this.templateData.settings?.prompt_template?.variables;
    if (variables && variables[variableIndex] && Array.isArray(variables[variableIndex].values)) {
      variables[variableIndex].values!.splice(valueIndex, 1);
    }
  }

  updateVariableValues(index: number): void {
    const variables = this.templateData.settings?.prompt_template?.variables;
    if (!variables || !variables[index] || !Array.isArray(variables[index].values)) return;
    // If you need to parse a string to array, do it in the UI logic, not in the model object
  }

  addTheme() {
    const visualStyle = this.templateData.settings?.visual_style;
    if (visualStyle && Array.isArray(visualStyle.themes)) {
      visualStyle.themes.push({
        // Provide a default theme object as needed
      });
    }
  }
  removeTheme(index: number) {
    const visualStyle = this.templateData.settings?.visual_style;
    if (visualStyle && Array.isArray(visualStyle.themes)) {
      visualStyle.themes.splice(index, 1);
    }
  }

  addVariable() {
    const variables = this.templateData.settings?.prompt_template?.variables;
    if (variables) {
      variables.push({
        name: '',
        values: []
      });
    }
  }

  removeVariable(index: number) {
    const variables = this.templateData.settings?.prompt_template?.variables;
    if (variables && variables.length > index) {
      variables.splice(index, 1);
    }
  }

  addTimeSlot() {
    if (!this.templateData.schedule) {
      this.templateData.schedule = { days_of_week: [], time_slots: [] };
    }
    if (!this.templateData.schedule.time_slots) {
      this.templateData.schedule.time_slots = [];
    }
    const first = this.timeSlotOptions[0];
    const [hour, minute] = first.value.split(':').map(Number);
    const timezone = this.timeZoneOptions[0];
    this.templateData.schedule.time_slots.push({ hour, minute, timezone });
  }

  onTimeSlotChange(i: number, value: string) {
    const [hour, minute] = value.split(':').map(Number);
    if (this.templateData.schedule?.time_slots && this.templateData.schedule.time_slots[i]) {
      this.templateData.schedule.time_slots[i].hour = hour;
      this.templateData.schedule.time_slots[i].minute = minute;
    }
  }

  removeTimeSlot(index: number) {
    if (this.templateData.schedule?.time_slots) {
      this.templateData.schedule.time_slots.splice(index, 1);
    }
  }

  toggleDayOfWeek(day: string, checked: boolean) {
    if (!this.templateData.schedule) {
      this.templateData.schedule = { days_of_week: [], time_slots: [] };
    }
    if (!this.templateData.schedule.days_of_week) {
      this.templateData.schedule.days_of_week = [];
    }
    const dayValue = this.daysOfWeekOptions.find(d => d.label === day)?.value || day.toLowerCase();
    const idx = this.templateData.schedule.days_of_week.indexOf(dayValue as any);
    if (checked && idx === -1) {
      this.templateData.schedule.days_of_week.push(dayValue as any);
    } else if (!checked && idx !== -1) {
      this.templateData.schedule.days_of_week.splice(idx, 1);
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
    (this.templateData.settings?.prompt_template?.variables || []).forEach((v: any, i: number) => this.updateVariableValues(i));
    let backendContentType: ContentType;
    try {
      backendContentType = (this.templateData.templateInfo?.contentType || 'text') as ContentType;
    } catch (err: any) {
      this.snackBar.open('Invalid content type selected. Please choose a valid type.', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.loading = false;
      return;
    }
    const contentType = backendContentType;
    let systemPrompt = '';
    if (contentType === 'multi_image') {
      systemPrompt = `You are a helpful assistant creating social content for multiple images.  \nAlways respond with a single JSON object containing exactly three keys (all lowercase):\n  • "comment": a brief caption for the entire post, as a string  \n  • "hashtags": an array of hashtag strings for the entire post  \n  • "images": an array of objects, each with exactly one key:\n      – "text": the main content for that image, as a string  \nThe number of entries in "images" must exactly match the number of images requested.  \nDo not include any extra fields, wrapping objects, or explanatory text—only the JSON object.`;
    } else {
      systemPrompt = `You are a helpful assistant creating social content. Always respond with a single JSON object containing exactly three keys:\n  • "text": the main post content as a string\n  • "comment": a brief comment or caption as a string\n  • "hashtags": an array of hashtag strings\nDo not include any extra fields or explanatory text.`;
    }
    const promptTemplate = {
      ...this.templateData.settings?.prompt_template,
      system_prompt: systemPrompt,
      model: 'gpt-4.1',
      temperature: 0.7,
      max_tokens: 512,
      variables: (this.templateData.settings?.prompt_template?.variables || []).map((v: any) => ({
        name: v.name,
        values: v.values
      }))
    };
    const data: ContentGenerationTemplateDocument = {
      ...this.templateData,
      templateInfo: {
        ...this.templateData.templateInfo,
        contentType: backendContentType,
        socialAccounts: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo?.description || ''
      },
      settings: {
        ...this.templateData.settings,
        prompt_template: promptTemplate
      }
    };
    // Debug log for outgoing payload
    console.log('Submitting template data:', data);
    const url = `/api/content_generation_template_management`;
    this.http.post(url, data).subscribe({
      next: () => {
        this.snackBar.open('Template created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        if (this.brandId) this.fetchTemplatesForBrand(this.brandId);
        this.loading = false;
      },
      error: (err) => {
        // Enhanced error handling: log error and show details if available
        console.error('Create template error:', err);
        let message = 'Failed to create template.';
        if (err?.error) {
          if (typeof err.error === 'string') {
            try {
              const parsed = JSON.parse(err.error);
              message = parsed.error || message;
              if (parsed.details && Array.isArray(parsed.details)) {
                message += '\n' + parsed.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
              }
            } catch {
              message = err.error;
            }
          } else if (typeof err.error === 'object') {
            message = err.error.error || message;
            if (err.error.details && Array.isArray(err.error.details)) {
              message += '\n' + err.error.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
            }
          }
        }
        this.snackBar.open(message, 'Close', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.errorHandler.handleError(err);
        this.loading = false;
      }
    });
  }

  onUpdate() {
    if (!this.templateId) return;
    this.loading = true;
    (this.templateData.settings?.prompt_template?.variables || []).forEach((v: any, i: number) => this.updateVariableValues(i));
    let backendContentType: ContentType;
    try {
      backendContentType = (this.templateData.templateInfo?.contentType || 'text') as ContentType;
    } catch (err: any) {
      this.snackBar.open('Invalid content type selected. Please choose a valid type.', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.loading = false;
      return;
    }
    const contentType = backendContentType;
    let systemPrompt = '';
    if (contentType === 'multi_image') {
      systemPrompt = `You are a helpful assistant creating social content for multiple images.  \nAlways respond with a single JSON object containing exactly three keys (all lowercase):\n  • "comment": a brief caption for the entire post, as a string  \n  • "hashtags": an array of hashtag strings for the entire post  \n  • "images": an array of objects, each with exactly one key:\n      – "text": the main content for that image, as a string  \nThe number of entries in "images" must exactly match the number of images requested.  \nDo not include any extra fields, wrapping objects, or explanatory text—only the JSON object.`;
    } else {
      systemPrompt = `You are a helpful assistant creating social content. Always respond with a single JSON object containing exactly three keys:\n  • "text": the main post content as a string\n  • "comment": a brief comment or caption as a string\n  • "hashtags": an array of hashtag strings\nDo not include any extra fields or explanatory text.`;
    }
    const promptTemplate = {
      ...this.templateData.settings?.prompt_template,
      system_prompt: systemPrompt,
      model: 'gpt-4.1',
      temperature: 0.7,
      max_tokens: 512,
      variables: (this.templateData.settings?.prompt_template?.variables || []).map((v: any) => ({
        name: v.name,
        values: v.values
      }))
    };
    const data: ContentGenerationTemplateDocument = {
      ...this.templateData,
      templateInfo: {
        ...this.templateData.templateInfo,
        contentType: backendContentType,
        socialAccounts: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo?.description || ''
      },
      settings: {
        ...this.templateData.settings,
        prompt_template: promptTemplate
      }
    };
    // Debug log for outgoing payload
    console.log('Updating template data:', data);
    const url = `/api/content_generation_template_management/${this.templateId}`;
    this.http.put(url, data).subscribe({
      next: () => {
        this.snackBar.open('Template updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        if (this.brandId) this.fetchTemplatesForBrand(this.brandId);
        this.loading = false;
      },
      error: (err) => {
        // Enhanced error handling: log error and show details if available
        console.error('Update template error:', err);
        let message = 'Failed to update template.';
        if (err?.error) {
          if (typeof err.error === 'string') {
            try {
              const parsed = JSON.parse(err.error);
              message = parsed.error || message;
              if (parsed.details && Array.isArray(parsed.details)) {
                message += '\n' + parsed.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
              }
            } catch {
              message = err.error;
            }
          } else if (typeof err.error === 'object') {
            message = err.error.error || message;
            if (err.error.details && Array.isArray(err.error.details)) {
              message += '\n' + err.error.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
            }
          }
        }
        this.snackBar.open(message, 'Close', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.errorHandler.handleError(err);
        this.loading = false;
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
    if (!this.templateData.schedule || !this.templateData.schedule.time_slots) return '';
    const slot = this.templateData.schedule.time_slots[i];
    if (!slot) return '';
    const hour = slot.hour?.toString().padStart(2, '0') ?? '00';
    const minute = slot.minute?.toString().padStart(2, '0') ?? '00';
    return `${hour}:${minute}`;
  }

  // Helper to get or initialize the image object for form input only (no actual image data or preview)
  get image() {
    if (!this.templateData.settings) {
      this.templateData.settings = { contentItem: {} } as any;
    }
    // Defensive: if settings is still undefined, return empty object
    if (!this.templateData.settings) return {};
    if (!this.templateData.settings.contentItem) {
      this.templateData.settings.contentItem = {};
    }
    if (!this.templateData.settings.contentItem) return {};
    if (!this.templateData.settings.contentItem.image) {
      this.templateData.settings.contentItem.image = {};
    }
    return this.templateData.settings.contentItem.image || {};
  }

  get imageDimensions() {
    if (!this.image.dimensions) {
      this.image.dimensions = {};
    }
    return this.image.dimensions;
  }

  onDeleteTemplate() {
    if (!this.templateId) return;
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      this.http.delete(`/api/content_generation_template_management/${this.templateId}`)
        .subscribe(
          () => {
            this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
            this.templateId = null;
            this.createNewTemplate();
            this.fetchTemplatesForBrand(this.brandId!);
          },
          (err) => {
            this.snackBar.open('Failed to delete template', 'Close', { duration: 3000 });
          }
        );
    }
  }
}
