import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generate-page',
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './generate-page.component.html',
  styleUrl: './generate-page.component.scss'
})
export class GeneratePageComponent implements OnDestroy, OnInit {
  brandId: string | null = null;
  templateId: string | null = null; // For update
  templateData: any = {
    templateInfo: {
      name: '',
      brandId: ''
    },
    schedule: {
      cron: ''
    },
    settings: {
      promptTemplate: {
        systemPrompt: ''
      },
      visualStyle: {},
      contentStrategy: {},
      platformSpecific: {}
    }
  };
  apiResponse: any = null;
  apiError: any = null;
  private subscription: any;
  templates: any[] = [];

  daysOfWeekOptions = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  contentTypeOptions = [
    { value: 'post', label: 'Post' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
    { value: 'carousel', label: 'Carousel' }
  ];
  frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];
  modelOptions = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ];
  imageLayoutOptions = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
    { value: 'square', label: 'Square' }
  ];

  constructor(private navigationService: NavigationService, private http: HttpClient) {}

  ngOnInit() {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => {
        this.brandId = id;
        this.templateData.templateInfo.brandId = id;
        if (id) {
          this.fetchTemplates();
        } else {
          this.templates = [];
        }
      }
    );
    if (this.brandId) {
      this.fetchTemplates();
    }
  }

  onSubmit() {
    this.apiResponse = null;
    this.apiError = null;
    const url = `/api/content_generation_template_management`;
    this.http.post(url, this.templateData).subscribe({
      next: (res) => {
        this.apiResponse = res;
        this.fetchTemplates();
      },
      error: (err) => this.apiError = err.error || err
    });
  }

  onUpdate() {
    if (!this.templateId) return;
    this.apiResponse = null;
    this.apiError = null;
    const url = `/api/content_generation_template_management/${this.templateId}`;
    this.http.put(url, this.templateData).subscribe({
      next: (res) => {
        this.apiResponse = res;
        this.fetchTemplates();
      },
      error: (err) => this.apiError = err.error || err
    });
  }

  fetchTemplates() {
    if (!this.brandId) return;
    const url = `/api/content_generation_template_management?brandId=${this.brandId}`;
    this.http.get<any[]>(url).subscribe({
      next: (res) => this.templates = res,
      error: (err) => this.templates = []
    });
  }

  addTimeSlot() {
    if (!this.templateData.schedule.timeSlots) {
      this.templateData.schedule.timeSlots = [];
    }
    this.templateData.schedule.timeSlots.push({ hour: 9, minute: 0, timezone: 'America/New_York' });
  }

  removeTimeSlot(index: number) {
    this.templateData.schedule.timeSlots.splice(index, 1);
  }

  addVariable() {
    if (!this.templateData.settings.promptTemplate.variables) {
      this.templateData.settings.promptTemplate.variables = [];
    }
    this.templateData.settings.promptTemplate.variables.push({ name: '', values: [], valuesString: '' });
  }

  removeVariable(index: number) {
    this.templateData.settings.promptTemplate.variables.splice(index, 1);
  }

  updateVariableValues(index: number) {
    const variable = this.templateData.settings.promptTemplate.variables[index];
    if (variable.valuesString !== undefined) {
      variable.values = variable.valuesString.split(',').map((v: string) => v.trim()).filter((v: string) => v);
    }
  }

  // Patch variables to have valuesString for editing
  selectTemplate(template: any) {
    this.templateId = template.id;
    this.templateData = JSON.parse(JSON.stringify(template));
    // Patch variables for editing
    if (this.templateData.settings?.promptTemplate?.variables) {
      this.templateData.settings.promptTemplate.variables = this.templateData.settings.promptTemplate.variables.map((v: any) => ({
        ...v,
        valuesString: v.values ? v.values.join(', ') : ''
      }));
    }
    this.apiResponse = null;
    this.apiError = null;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
