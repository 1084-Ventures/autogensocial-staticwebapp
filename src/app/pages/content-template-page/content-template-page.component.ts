import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ContentTemplateSidenavComponent } from './content-template-sidenav/content-template-sidenav.component';
import { ContentTemplateInfoFormComponent } from './content-template-info-form/content-template-info-form.component';
import { ContentTemplatePromptFormComponent } from './content-template-prompt-form/content-template-prompt-form.component';
import { ContentItemFormComponent } from './content-item-form';
import type { components } from '../../generated/models';
type ContentGenerationTemplateDocument = components['schemas']['ContentGenerationTemplateDocument'];
type TemplateInfo = components['schemas']['TemplateInfo'];
type TemplateSettings = components['schemas']['TemplateSettings'];
type ContentItem = components['schemas']['ContentItem'];
type SocialAccountEntry = components['schemas']['SocialAccountEntry'];
type Platform = components['schemas']['Platform'];
type PromptTemplate = components['schemas']['PromptTemplate'];
type ImagesTemplate = components['schemas']['ImagesTemplate'];
type VideoTemplate = components['schemas']['VideoTemplate'];
type Text = components['schemas']['Text'];
type ContentType = 'text' | 'images' | 'video';
// ...existing code removed...
@Component({
  selector: 'app-content-template-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, ContentTemplateSidenavComponent, ContentTemplateInfoFormComponent, ContentTemplatePromptFormComponent, ContentItemFormComponent],
  templateUrl: './content-template-page.component.html',
  styleUrls: ['./content-template-page.component.scss']
})
export class ContentTemplatePageComponent {
  brandId: string | null = null;
  contentTemplates: ContentGenerationTemplateDocument[] = [];
  selectedTemplate: ContentGenerationTemplateDocument | null = null;
  form: FormGroup;
  addingTemplate = false;

  // --- CRUD for Social Accounts (FormArray) ---
  get socialAccounts(): FormArray {
    return this.templateInfoGroup.get('socialAccounts') as FormArray;
  }
  addSocialAccount() {
    this.socialAccounts.push(this.fb.group({ platform: [''] }));
  }
  removeSocialAccount(i: number) {
    this.socialAccounts.removeAt(i);
  }

  // --- CRUD for Prompt Variables (FormArray) ---
  get variables(): FormArray {
    return this.promptTemplateGroup.get('variables') as FormArray;
  }
  addVariable() {
    this.variables.push(this.fb.group({ name: [''], values: [[]] }));
  }
  removeVariable(i: number) {
    this.variables.removeAt(i);
  }

  // --- CRUD for Image Templates (FormArray) ---
  get imageTemplates(): FormArray {
    return this.contentItemGroup.get('imagesTemplate.imageTemplates') as FormArray;
  }
  addImageTemplate() {
    this.imageTemplates.push(this.fb.group({ setUrl: [''], format: [''], aspectRatio: ['square'], mediaType: ['uploaded'] }));
  }
  removeImageTemplate(i: number) {
    this.imageTemplates.removeAt(i);
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      templateInfo: this.fb.group({
        name: ['', Validators.required],
        description: [''],
        socialAccounts: this.fb.array([])
      }),
      templateSettings: this.fb.group({
        contentItem: this.fb.group({
          contentType: ['images', Validators.required],
          imagesTemplate: this.fb.group({
            imageTemplates: this.fb.array([]),
            numImages: [1]
          }),
          videoTemplate: this.fb.group({}),
          text: this.fb.group({ value: [''] })
        }),
        promptTemplate: this.fb.group({
          systemPrompt: [''],
          userPrompt: ['', Validators.required],
          temperature: [1],
          maxTokens: [256],
          model: [''],
          variables: this.fb.array([])
        })
      })
    });

    // React to contentType changes
    this.contentItemGroup.get('contentType')?.valueChanges.subscribe((type: ContentType) => {
      this.configureContentItemForm(type);
    });
  }

  get templateInfoGroup(): FormGroup {
    return this.form.get('templateInfo') as FormGroup;
  }
  get templateSettingsGroup(): FormGroup {
    return this.form.get('templateSettings') as FormGroup;
  }
  get contentItemGroup(): FormGroup {
    return this.templateSettingsGroup.get('contentItem') as FormGroup;
  }
  get promptTemplateGroup(): FormGroup {
    return this.templateSettingsGroup.get('promptTemplate') as FormGroup;
  }
  get socialAccountsArray(): FormArray {
    return this.templateInfoGroup.get('socialAccounts') as FormArray;
  }
  get imageTemplatesArray(): FormArray {
    return this.contentItemGroup.get('imagesTemplate.imageTemplates') as FormArray;
  }

  configureContentItemForm(type: ContentType) {
    // Remove all existing controls except contentType
    const group = this.contentItemGroup;
    Object.keys(group.controls).forEach(key => {
      if (key !== 'contentType') group.removeControl(key);
    });
    if (type === 'images') {
      group.addControl('imagesTemplate', this.fb.group({
        imageTemplates: this.fb.array([]),
        numImages: [1]
      }));
    } else if (type === 'video') {
      group.addControl('videoTemplate', this.fb.group({
        setUrl: [''],
        format: [''],
        aspectRatio: ['square'],
        mediaType: ['uploaded']
      }));
    } else if (type === 'text') {
      group.addControl('text', this.fb.group({ value: [''] }));
    }
  }

  get contentType(): ContentType | undefined {
    return this.contentItemGroup.get('contentType')?.value;
  }

  onAddTemplate() {
    this.addingTemplate = true;
    this.form.reset({
      templateInfo: { name: '', description: '', socialAccounts: [] },
      templateSettings: {
        contentItem: { contentType: 'images', imagesTemplate: { imageTemplates: [], numImages: 1 } },
        promptTemplate: { userPrompt: '', variables: [] }
      }
    });
    this.configureContentItemForm('images');
    // Add one social account, one variable, and one image template by default for UX
    this.addSocialAccount();
    this.addVariable();
    this.addImageTemplate();
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
  }
}
