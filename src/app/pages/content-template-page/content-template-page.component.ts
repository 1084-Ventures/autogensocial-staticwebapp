import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { ContentTemplateSidenavComponent } from './content-template-sidenav/content-template-sidenav.component';
import { ContentTemplateFormComponent } from './content-template-form/content-template-form.component';
import { ContentTemplateEditComponent } from './content-template-edit/content-template-edit.component';
import { ContentGenerationTemplateService } from '../../core/services/content-generation-template.service';
import { NavigationService } from '../../core/services/navigation.service';
import type { components } from '../../generated/models';

type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
type ContentGenerationTemplateCreate = components["schemas"]["ContentGenerationTemplateCreate"];
type ContentGenerationTemplateUpdate = components["schemas"]["ContentGenerationTemplateUpdate"];

@Component({
  selector: 'app-content-template-page',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ContentTemplateSidenavComponent,
    ContentTemplateFormComponent,
    ContentTemplateEditComponent
  ],
  templateUrl: './content-template-page.component.html',
  styleUrl: './content-template-page.component.scss'
})
export class ContentTemplatePageComponent implements OnDestroy {
  public brandId: string | null = null;
  public templateList: ContentGenerationTemplateDocument[] = [];
  public selectedTemplate: ContentGenerationTemplateDocument | null = null;
  public showForm = false;
  public isProcessing = false;
  public feedbackMessage: string | null = null;
  private subscription: any;
  public newTemplateModel: ContentGenerationTemplateCreate = {} as ContentGenerationTemplateCreate;

  constructor(
    private navigationService: NavigationService,
    private templateService: ContentGenerationTemplateService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => {
        this.brandId = id;
        if (id) this.loadTemplates();
      }
    );
  }

  // Only initialize the model object and pass it down
  openForm() {
    this.selectedTemplate = null;
    this.showForm = true;
    this.feedbackMessage = null;
    this.newTemplateModel = {
      brandId: this.brandId || ''
      // All other fields are handled by the form component and model type
    } as ContentGenerationTemplateCreate;
    console.log('[openForm] showForm:', this.showForm, 'brandId:', this.brandId, 'newTemplateModel:', this.newTemplateModel);
    this.cdr.detectChanges();
  }

  loadTemplates() {
    if (!this.brandId) return;
    this.templateService.getTemplates({ brandId: this.brandId }).subscribe({
      next: (templates) => {
        this.templateList = templates.filter(t => t.brandId === this.brandId);
        this.selectedTemplate = null;
        this.feedbackMessage = null;
      },
      error: () => {
        this.feedbackMessage = 'Error loading templates.';
      }
    });
  }

  selectTemplate(template: ContentGenerationTemplateDocument) {
    // Ensure templateInfo is always defined
    if (!template.templateInfo) {
      template.templateInfo = { name: '', description: '', socialAccounts: [] };
    }
    this.selectedTemplate = template;
    this.showForm = false;
    this.feedbackMessage = null;
  }

  submitForm(form: any) {
    if (!this.brandId) return;
    this.isProcessing = true;
    const payload: ContentGenerationTemplateCreate = {
      ...this.newTemplateModel,
      brandId: this.brandId
    };
    this.templateService.createTemplate(payload).subscribe({
      next: (created) => {
        this.feedbackMessage = 'Template created successfully!';
        this.loadTemplates();
        this.selectedTemplate = created;
        this.showForm = false;
        this.isProcessing = false;
      },
      error: () => {
        this.feedbackMessage = 'Error creating template.';
        this.isProcessing = false;
      }
    });
  }

  submitEditForm(form: any) {
    if (!this.selectedTemplate) return;
    this.isProcessing = true;
    const payload: ContentGenerationTemplateUpdate = {
      ...form.value,
      brandId: this.selectedTemplate.brandId
    };
    this.templateService.updateTemplate(this.selectedTemplate.id!, payload).subscribe({
      next: (updated) => {
        this.feedbackMessage = 'Template updated successfully!';
        this.loadTemplates();
        this.selectedTemplate = updated;
        this.isProcessing = false;
      },
      error: () => {
        this.feedbackMessage = 'Error updating template.';
        this.isProcessing = false;
      }
    });
  }

  deleteTemplate() {
    if (!this.selectedTemplate) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    this.isProcessing = true;
    this.templateService.deleteTemplate(this.selectedTemplate.id!).subscribe({
      next: () => {
        this.feedbackMessage = 'Template deleted successfully!';
        this.loadTemplates();
        this.selectedTemplate = null;
        this.isProcessing = false;
      },
      error: () => {
        this.feedbackMessage = 'Error deleting template.';
        this.isProcessing = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
