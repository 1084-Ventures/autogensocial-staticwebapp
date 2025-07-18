import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import type { components } from '../../generated/models';
import { ContentTemplateSidenavComponent } from './content-template-sidenav/content-template-sidenav.component';
import { ContentTemplateInfoFormComponent } from './content-template-info-form/content-template-info-form.component';
import { ContentTemplatePromptFormComponent } from './content-template-prompt-form/content-template-prompt-form.component';
import { ContentItemFormComponent } from './content-item-form';

// Type aliases for OpenAPI-generated models
// (These are for type safety and IDE support)
type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];
type TemplateInfo = components["schemas"]["TemplateInfo"];
type TemplateSettings = components["schemas"]["TemplateSettings"];
type PromptTemplate = components["schemas"]["PromptTemplate"];
type PromptVariable = components["schemas"]["PromptVariable"];
type ImagesTemplate = components["schemas"]["ImagesTemplate"];
type ImageTemplate = components["schemas"]["ImageTemplate"];
type VideoTemplate = components["schemas"]["VideoTemplate"];
type ContentItem = components["schemas"]["ContentItem"];

@Component({
  selector: 'app-content-template-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    ContentTemplateSidenavComponent,
    ContentTemplateInfoFormComponent,
    ContentTemplatePromptFormComponent,
    ContentItemFormComponent
  ],
  templateUrl: './content-template-page.component.html',
  styleUrls: ['./content-template-page.component.scss']
})
export class ContentTemplatePageComponent {
  brandId: string | null = null;
  contentTemplates: ContentGenerationTemplateDocument[] = [];
  selectedTemplate: ContentGenerationTemplateDocument | null = null;
  form: FormGroup;
  addingTemplate = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      templateInfo: this.fb.group({
        name: ['', Validators.required],
        description: [''],
        socialAccounts: [[]]
      }),
      templateSettings: this.fb.group({
        promptTemplate: this.fb.group({
          systemPrompt: [''],
          userPrompt: ['', Validators.required],
          temperature: [1],
          maxTokens: [256],
          model: [''],
          variables: this.fb.array([])
        }),
        contentItem: this.fb.group({
          contentType: ['images'],
          text: this.fb.group({ value: [''] }),
          videoTemplate: this.fb.group({ setUrl: [''], format: [''], aspectRatio: ['square'], mediaType: ['uploaded'] }),
          imagesTemplate: this.fb.group({ imageTemplates: this.fb.array([]), numImages: [1] })
        })
      })
    });

    // React to contentType changes
    this.form.get('templateSettings.contentItem.contentType')?.valueChanges.subscribe((type: string) => {
      this.configureContentItemForm(type);
    });
  }

  get templateInfoGroup(): FormGroup {
    return this.form.get('templateInfo') as FormGroup;
  }

  get promptTemplateGroup(): FormGroup {
    return this.form.get('templateSettings.promptTemplate') as FormGroup;
  }

  get imageTemplates(): FormArray {
    return this.form.get('templateSettings.contentItem.imagesTemplate.imageTemplates') as FormArray;
  }

  get contentType(): string | undefined {
    return this.form.get('templateSettings.contentItem.contentType')?.value;
  }

  get contentItemFormGroup(): FormGroup {
    if (this.contentType === 'images') {
      return this.form.get('templateSettings.contentItem.imagesTemplate') as FormGroup;
    } else if (this.contentType === 'video') {
      return this.form.get('templateSettings.contentItem.videoTemplate') as FormGroup;
    } else {
      return this.form.get('templateSettings.contentItem.text') as FormGroup;
    }
  }

  configureContentItemForm(type: string) {
    // Hide/show relevant controls based on contentType
    const imagesTemplate = this.form.get('templateSettings.contentItem.imagesTemplate');
    const videoTemplate = this.form.get('templateSettings.contentItem.videoTemplate');
    const text = this.form.get('templateSettings.contentItem.text');
    if (type === 'images') {
      imagesTemplate?.enable();
      videoTemplate?.disable();
      text?.disable();
    } else if (type === 'video') {
      imagesTemplate?.disable();
      videoTemplate?.enable();
      text?.disable();
    } else if (type === 'text') {
      imagesTemplate?.disable();
      videoTemplate?.disable();
      text?.enable();
    }
  }

  onAddTemplate() {
    this.addingTemplate = true;
    this.form.reset({
      templateInfo: { name: '', description: '', socialAccounts: [] },
      templateSettings: {
        promptTemplate: { systemPrompt: '', userPrompt: '', temperature: 1, maxTokens: 256, model: '', variables: [] },
        contentItem: {
          contentType: 'images',
          text: { value: '' },
          videoTemplate: { setUrl: '', format: '', aspectRatio: 'square', mediaType: 'uploaded' },
          imagesTemplate: { imageTemplates: [], numImages: 1 }
        }
      }
    });
    this.configureContentItemForm('images');
    // Add one variable and one image template by default for UX
    (this.form.get('templateSettings.promptTemplate.variables') as FormArray).push(this.fb.group({ name: [''], values: [[]] }));
    (this.form.get('templateSettings.contentItem.imagesTemplate.imageTemplates') as FormArray).push(this.fb.group({ setUrl: [''], format: [''], aspectRatio: ['square'], mediaType: ['uploaded'] }));
  }

  onSaveTemplate() {
    if (this.form.valid) {
      // TODO: Submit to backend using correct model structure
      this.addingTemplate = false;
    } else {
      this.form.markAllAsTouched();
    }
  }

  onDeleteTemplate(template: ContentGenerationTemplateDocument) {
    // TODO: Call backend to delete, then update local list
    this.contentTemplates = this.contentTemplates.filter(t => t !== template);
    if (this.selectedTemplate === template) {
      this.selectedTemplate = null;
    }
  }

  onCancel() {
    this.addingTemplate = false;
    this.form.reset();
    this.selectedTemplate = null;
  }
}