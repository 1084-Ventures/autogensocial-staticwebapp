import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavigationService } from '../../services/navigation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlerService } from '../../services/error-handler.service';

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
  templateData: any = {
    templateInfo: {
      name: '',
      description: '',
      contentType: '',
      brandId: '',
      targetPlatforms: []
    },
    settings: {
      promptTemplate: {
        systemPrompt: '',
        userPrompt: '',
        model: '',
        temperature: 1,
        maxTokens: 256,
        variables: []
      },
      visualStyle: {
        themes: [
          // Each theme should match the structure in visual-style.yaml
          // Example:
          // { font: {...}, color: {...}, outline: {...}, alignment: {...}, ... }
        ]
      },
      image: {}, // Should match image.yaml structure
    },
    schedule: {
      daysOfWeek: [],
      timeSlots: []
    }
  };
  private subscription: any;

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
  daysOfWeekOptions = [
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

  templates: any[] = [];
  loading = false;

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
        this.templateData.templateInfo.brandId = id;
        if (id) {
          this.fetchTemplatesForBrand(id);
        }
      }
    );
  }

  fetchTemplatesForBrand(brandId: string) {
    this.http.get<any[]>(`/api/content_generation_template_management?brandId=${brandId}`)
      .subscribe(
        (templates) => { this.templates = templates || []; },
        (err) => { this.templates = []; }
      );
  }

  selectTemplate(template: any) {
    this.templateId = template.id;
    this.http.get<any>(`/api/content_generation_template_management/${template.id}`)
      .subscribe(
        (fullTemplate) => {
          const info = fullTemplate.templateInfo || {};
          const settings = fullTemplate.settings || {};
          const promptTemplate = settings.promptTemplate || {};
          let visualStyle = settings.visualStyle || {};
          if (visualStyle.themes) {
            visualStyle.themes = visualStyle.themes.map((theme: any) => ({
              ...theme,
              box: theme.box || { color: '#000000', alpha: 128 }
            }));
          }
          const image = settings.image || {};
          const sched = fullTemplate.schedule || { daysOfWeek: [], timeSlots: [] };
          const platformsObj = info.targetPlatforms || {};
          this.templateData = {
            templateInfo: {
              name: info.name || '',
              description: info.description || '',
              contentType: info.contentType || '',
              brandId: info.brandId || this.brandId || '',
              targetPlatforms: platformsObj
            },
            settings: {
              promptTemplate: {
                systemPrompt: promptTemplate.systemPrompt || '',
                userPrompt: promptTemplate.userPrompt || '',
                model: promptTemplate.model || '',
                temperature: promptTemplate.temperature !== undefined ? promptTemplate.temperature : 1,
                maxTokens: promptTemplate.maxTokens !== undefined ? promptTemplate.maxTokens : 256,
                variables: (promptTemplate.variables || []).map((v: any) => ({
                  name: v.name || '',
                  values: v.values || [],
                  valuesString: (v.values || []).join(', ')
                }))
              },
              visualStyle: visualStyle,
              image: image
            },
            schedule: {
              daysOfWeek: sched.daysOfWeek || [],
              timeSlots: sched.timeSlots || []
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
    if ((value || '').trim()) {
      this.templateData.settings.promptTemplate.variables[variableIndex].values.push(value.trim());
    }
    if (input) {
      input.value = '';
    }
  }

  removeVariableValue(variableIndex: number, valueIndex: number) {
    this.templateData.settings.promptTemplate.variables[variableIndex].values.splice(valueIndex, 1);
  }

  addTimeSlot() {
    if (!this.templateData.schedule) {
      this.templateData.schedule = { daysOfWeek: [], timeSlots: [] };
    }
    if (!this.templateData.schedule.timeSlots) {
      this.templateData.schedule.timeSlots = [];
    }
    // Default to first time slot and current or default timezone
    const first = this.timeSlotOptions[0];
    const [hour, minute] = first.value.split(':').map(Number);
    const timezone = this.templateData.schedule.timeZone || this.timeZoneOptions[0];
    this.templateData.schedule.timeSlots.push({ hour, minute, timezone });
  }

  onTimeSlotChange(i: number, value: string) {
    const [hour, minute] = value.split(':').map(Number);
    if (this.templateData.schedule.timeSlots[i]) {
      this.templateData.schedule.timeSlots[i].hour = hour;
      this.templateData.schedule.timeSlots[i].minute = minute;
    }
  }

  removeTimeSlot(index: number) {
    if (this.templateData.schedule && this.templateData.schedule.timeSlots) {
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
    const idx = this.templateData.schedule.daysOfWeek.indexOf(dayValue);
    if (checked && idx === -1) {
      this.templateData.schedule.daysOfWeek.push(dayValue);
    } else if (!checked && idx !== -1) {
      this.templateData.schedule.daysOfWeek.splice(idx, 1);
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
    // Ensure all variable values are up to date from valuesString
    this.templateData.settings.promptTemplate.variables.forEach((v: any, i: number) => this.updateVariableValues(i));
    let backendContentType: string;
    try {
      backendContentType = this.mapContentType(this.templateData.templateInfo.contentType);
    } catch (err: any) {
      this.snackBar.open('Invalid content type selected. Please choose a valid type.', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.loading = false;
      return;
    }
    // Set systemPrompt dynamically based on contentType
    const contentType = backendContentType;
    let systemPrompt = '';
    if (contentType === 'multi-image') {
      systemPrompt = `You are a helpful assistant creating social content for multiple images.  \nAlways respond with a single JSON object containing exactly three keys (all lowercase):\n  • "comment": a brief caption for the entire post, as a string  \n  • "hashtags": an array of hashtag strings for the entire post  \n  • "images": an array of objects, each with exactly one key:\n      – "text": the main content for that image, as a string  \nThe number of entries in "images" must exactly match the number of images requested.  \nDo not include any extra fields, wrapping objects, or explanatory text—only the JSON object.`;
    } else {
      systemPrompt = `You are a helpful assistant creating social content. Always respond with a single JSON object containing exactly three keys:\n  • "text": the main post content as a string\n  • "comment": a brief comment or caption as a string\n  • "hashtags": an array of hashtag strings\nDo not include any extra fields or explanatory text.`;
    }
    // Always include non-editable standards
    const promptTemplate = {
      ...this.templateData.settings.promptTemplate,
      systemPrompt,
      model: 'gpt-4.1', // or your required model
      temperature: 0.7,
      maxTokens: 512,
      variables: this.templateData.settings.promptTemplate.variables.map((v: any) => ({
        name: v.name,
        values: v.values
      }))
    };
    const data: any = {
      ...this.templateData,
      templateInfo: {
        ...this.templateData.templateInfo,
        contentType: backendContentType,
        targetPlatforms: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo.description || ''
      },
      settings: {
        ...this.templateData.settings,
        promptTemplate
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
    // Ensure all variable values are up to date from valuesString
    this.templateData.settings.promptTemplate.variables.forEach((v: any, i: number) => this.updateVariableValues(i));
    let backendContentType: string;
    try {
      backendContentType = this.mapContentType(this.templateData.templateInfo.contentType);
    } catch (err: any) {
      this.snackBar.open('Invalid content type selected. Please choose a valid type.', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.loading = false;
      return;
    }
    // Set systemPrompt dynamically based on contentType
    const contentType = backendContentType;
    let systemPrompt = '';
    if (contentType === 'multi-image') {
      systemPrompt = `You are a helpful assistant creating social content for multiple images.  \nAlways respond with a single JSON object containing exactly three keys (all lowercase):\n  • "comment": a brief caption for the entire post, as a string  \n  • "hashtags": an array of hashtag strings for the entire post  \n  • "images": an array of objects, each with exactly one key:\n      – "text": the main content for that image, as a string  \nThe number of entries in "images" must exactly match the number of images requested.  \nDo not include any extra fields, wrapping objects, or explanatory text—only the JSON object.`;
    } else {
      systemPrompt = `You are a helpful assistant creating social content. Always respond with a single JSON object containing exactly three keys:\n  • "text": the main post content as a string\n  • "comment": a brief comment or caption as a string\n  • "hashtags": an array of hashtag strings\nDo not include any extra fields or explanatory text.`;
    }
    // Always include non-editable standards
    const promptTemplate = {
      ...this.templateData.settings.promptTemplate,
      systemPrompt,
      model: 'gpt-4.1', // or your required model
      temperature: 0.7,
      maxTokens: 512,
      variables: this.templateData.settings.promptTemplate.variables.map((v: any) => ({
        name: v.name,
        values: v.values
      }))
    };
    const data: any = {
      ...this.templateData,
      templateInfo: {
        ...this.templateData.templateInfo,
        contentType: backendContentType,
        targetPlatforms: this.getSelectedPlatforms(),
        description: this.templateData.templateInfo.description || ''
      },
      settings: {
        ...this.templateData.settings,
        promptTemplate
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

  onFontChange() {
    // Optionally handle font change logic here
  }

  createNewTemplate() {
    this.templateId = null;
    this.templateData = {
      templateInfo: {
        name: '',
        description: '',
        contentType: '',
        brandId: this.brandId || '',
        targetPlatforms: []
      },
      settings: {
        promptTemplate: {
          systemPrompt: '',
          userPrompt: '',
          model: '',
          temperature: 1,
          maxTokens: 256,
          variables: []
        },
        visualStyle: {
          // Pre-populate with one default theme so the form always renders correctly
          themes: [{
            font: {
              family: 'Arial',
              weight: 'normal',
              style: 'normal'
            },
            fontSize: 32,
            color: '#222222',
            outlineColor: '#000000',
            outlineWidth: 0,
            alignment: 'center',
            backgroundColor: '#ffffff',
            box: {
              color: '#000000',
              alpha: 128
            }
          }]
        },
        image: {
          aspectRatio: '1:1',
          backgroundType: 'color',
          containerPadding: 0,
          textBoxHorizontalAlignment: 'center',
          textBoxVerticalAlignment: 'center'
        }
      },
      schedule: {
        daysOfWeek: [],
        timeSlots: []
      }
    };
  }

  onCancel() {
    this.templateId = null;
    this.createNewTemplate();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  // Ensure getSelectedPlatforms and updateVariableValues exist and are typed
  getSelectedPlatforms(): string[] {
    return Object.entries(this.templateData.templateInfo.targetPlatforms)
      .filter(([_, checked]) => checked)
      .map(([platform]) => platform);
  }

  updateVariableValues(index: number): void {
    const variable = this.templateData.settings.promptTemplate.variables[index];
    if (variable.valuesString !== undefined) {
      variable.values = variable.valuesString.split(',').map((v: string) => v.trim()).filter((v: string) => v);
    }
  }

  // Add methods to manage container and themes
  addTheme() {
    this.templateData.settings.visualStyle.themes.push({
      font: {
        family: 'Arial',
        weight: 'normal',
        style: 'normal'
      },
      fontSize: 32,
      color: '#222222',
      outlineColor: '#000000',
      outlineWidth: 0,
      alignment: 'center',
      backgroundColor: '#ffffff',
      box: {
        color: '#000000',
        alpha: 128
      }
    });
  }
  removeTheme(index: number) {
    this.templateData.settings.visualStyle.themes.splice(index, 1);
  }

  addVariable() {
    if (!this.templateData.settings.promptTemplate.variables) {
      this.templateData.settings.promptTemplate.variables = [];
    }
    this.templateData.settings.promptTemplate.variables.push({
      name: '',
      values: [],
      valuesString: ''
    });
  }

  removeVariable(index: number) {
    if (this.templateData.settings.promptTemplate.variables && this.templateData.settings.promptTemplate.variables.length > index) {
      this.templateData.settings.promptTemplate.variables.splice(index, 1);
    }
  }

  onAspectRatioChange() {
    const aspectRatio = this.templateData.settings.image.container.aspectRatio;
    if (aspectRatio === 'square') {
      this.templateData.settings.image.container.width = 1080;
      this.templateData.settings.image.container.height = 1080;
    } else if (aspectRatio === 'portrait') {
      this.templateData.settings.image.container.width = 1080;
      this.templateData.settings.image.container.height = 1350;
    } else if (aspectRatio === 'landscape') {
      this.templateData.settings.image.container.width = 1200;
      this.templateData.settings.image.container.height = 628;
    }
  }

  // Update platform selection logic to work with array of strings
  togglePlatform(platform: string, checked: boolean) {
    const arr = this.templateData.templateInfo.targetPlatforms;
    if (checked && !arr.includes(platform)) arr.push(platform);
    if (!checked) this.templateData.templateInfo.targetPlatforms = arr.filter((p: string) => p !== platform);
  }

  // Helper to get the string value for a time slot (for binding)
  slotString(i: number): string {
    const slot = this.templateData.schedule.timeSlots[i];
    if (!slot) return '';
    const hour = slot.hour?.toString().padStart(2, '0') ?? '00';
    const minute = slot.minute?.toString().padStart(2, '0') ?? '00';
    return `${hour}:${minute}`;
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
