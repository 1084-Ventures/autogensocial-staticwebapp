import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContentTemplateSidenavComponent } from './content-template-sidenav/content-template-sidenav.component';
import { ContentTemplateInfoFormComponent } from './content-template-info-form/content-template-info-form.component';
import { ContentTemplatePromptFormComponent } from './content-template-prompt-form/content-template-prompt-form.component';
import { components } from '../../generated/models';
import { ContentItemFormComponent } from './content-item-form';
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
  contentTemplates: any[] = [];
  selectedTemplate: any = null;

  form: FormGroup;
  addingTemplate = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      templateInfo: this.fb.group({
        name: ['', Validators.required],
        description: [''],
        contentType: ['', Validators.required],
        socialAccounts: [[]]
      }),
      promptTemplate: this.fb.group({
        userPrompt: ['', Validators.required],
        variables: this.fb.array([])
      }),
      contentItem: this.fb.group({})
    });

    // React to contentType changes
    this.templateInfoGroup.get('contentType')?.valueChanges.subscribe((type) => {
      this.configureContentItemForm(type);
    });
  }

  configureContentItemForm(type: components['schemas']['ContentType']) {
    const group = this.contentItemGroup;
    // Remove all existing controls
    Object.keys(group.controls).forEach(key => group.removeControl(key));
    if (type === 'image') {
      group.addControl('setUrl', this.fb.control(''));
      group.addControl('resolution', this.fb.control(''));
      group.addControl('format', this.fb.control(''));
    } else if (type === 'video') {
      group.addControl('setUrl', this.fb.control(''));
      group.addControl('resolution', this.fb.control(''));
      group.addControl('format', this.fb.control(''));
    } else if (type === 'multi-image') {
      group.addControl('images', this.fb.array([]));
    }
    // No controls for text
  }

  get contentItemGroup(): FormGroup {
    return this.form.get('contentItem') as FormGroup;
  }

  get contentType(): components['schemas']['ContentType'] | undefined {
    return this.templateInfoGroup.get('contentType')?.value;
  }

  get templateInfoGroup(): FormGroup {
    return this.form.get('templateInfo') as FormGroup;
  }
  get promptTemplateGroup(): FormGroup {
    return this.form.get('promptTemplate') as FormGroup;
  }

  onAddTemplate() {
    this.addingTemplate = true;
    this.form.reset({
      templateInfo: { name: '', description: '', contentType: '', socialAccounts: [] },
      promptTemplate: { userPrompt: '', variables: [] }
    });
  }

  onSaveTemplate() {
    if (this.form.valid) {
      // TODO: Submit to backend
      this.addingTemplate = false;
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.addingTemplate = false;
  }
}
