import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { ContentTemplateInfoFormComponent } from '../content-template-info-form/content-template-info-form.component';
import { ContentTemplateScheduleFormComponent } from '../content-template-schedule-form/content-template-schedule-form.component';
import { ContentTemplateSettingsFormComponent } from '../content-template-settings-form/content-template-settings-form.component';
import { ContentTemplateContentItemFormComponent } from '../content-template-content-item-form/content-template-content-item-form.component';

@Component({
  selector: 'app-content-template-form',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ContentTemplateInfoFormComponent,
    ContentTemplateScheduleFormComponent,
    ContentTemplateSettingsFormComponent,
    ContentTemplateContentItemFormComponent
  ],
  templateUrl: './content-template-form.component.html',
  styleUrls: ['./content-template-form.component.scss']
})
export class ContentTemplateFormComponent {
  // Shared defaults for image/video templates and visualStyleObj
  private defaultTheme = {
    textStyle: {
      font: {
        family: '',
        size: '',
        weight: 'normal',
        style: 'normal',
        color: ''
      },
      outline: {
        color: '',
        width: 0
      },
      alignment: 'left',
      transparency: 1
    },
    overlayBox: {
      color: '',
      transparency: 0,
      verticalLocation: 'top',
      horizontalLocation: 'left'
    },
    backgroundColor: ''
  };

  private defaultVisualStyleObj = {
    themes: [this.defaultTheme]
  };

  private defaultAspectRatio: 'square' | 'portrait' | 'landscape' | 'story' = 'square';

  private defaultImageTemplate = {
    mediaType: 'color',
    setUrl: '',
    visualStyleObj: this.defaultVisualStyleObj,
    aspectRatio: this.defaultAspectRatio,
    format: ''
  };

  private defaultVideoTemplate = {
    mediaType: 'color',
    setUrl: '',
    visualStyleObj: this.defaultVisualStyleObj,
    aspectRatio: this.defaultAspectRatio,
    format: '',
    contentType: 'video'
  };
  @Input() templateModel: any = {
    templateInfo: { name: '', description: '', socialAccounts: [] },
    schedule: { daysOfWeek: [], timeSlots: [] },
    templateSettings: {
      promptTemplate: {
        userPrompt: '',
        variables: [
          { name: '', values: [] }
        ]
      },
      contentItem: {
        contentType: 'images',
        imagesTemplate: {
          imageTemplates: [this.defaultImageTemplate],
          numImages: 1
        }
      }
    },
  };
  @Output() submitForm = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  onSubmit() {
    this.submitForm.emit();
  }
  onCancel() {
    this.cancelForm.emit();
  }
  ngOnInit() {
    // If templateModel is not provided, ensure it is initialized
    if (!this.templateModel) {
      this.templateModel = {
        templateInfo: { name: '', description: '', socialAccounts: [] },
        schedule: { daysOfWeek: [], timeSlots: [] },
        templateSettings: {
          promptTemplate: {
            userPrompt: '',
            variables: [
              { name: '', values: [] }
            ]
          },
          contentItem: {
            contentType: 'images',
            imagesTemplate: {
              imageTemplates: [this.defaultImageTemplate],
              numImages: 1
            }
          }
        },
      };
    } else {
      if (!this.templateModel.templateInfo) {
        this.templateModel.templateInfo = { name: '', description: '', socialAccounts: [] };
      }
      if (!this.templateModel.schedule) {
        this.templateModel.schedule = { daysOfWeek: [], timeSlots: [] };
      }
      if (!this.templateModel.templateSettings) {
        this.templateModel.templateSettings = {
          promptTemplate: {
            userPrompt: '',
            variables: [
              { name: '', values: [] }
            ]
          },
          contentItem: {
            contentType: 'images',
            imagesTemplate: {
              imageTemplates: [this.defaultImageTemplate],
              numImages: 1
            }
          }
        };
      } else {
        if (!this.templateModel.templateSettings.promptTemplate) {
          this.templateModel.templateSettings.promptTemplate = {
            userPrompt: '',
            variables: [
              { name: '', values: [] }
            ]
          };
        }
        if (!this.templateModel.templateSettings.contentItem) {
          this.templateModel.templateSettings.contentItem = {
            contentType: 'images',
            imagesTemplate: {
              imageTemplates: [this.defaultImageTemplate],
              numImages: 1
            }
          };
        }
      }
    }
  }

  onInfoChange(info: any) {
    if (this.templateModel) this.templateModel.templateInfo = info;
  }
  onScheduleChange(schedule: any) {
    if (this.templateModel) this.templateModel.schedule = schedule;
  }
  onSettingsChange(settings: any) {
    if (this.templateModel) this.templateModel.templateSettings = settings;
  }
  onContentItemChange(contentItem: any) {
    if (this.templateModel && this.templateModel.templateSettings) {
      // Dynamically update contentItem structure based on contentType
      if (contentItem.contentType === 'text') {
        this.templateModel.templateSettings.contentItem = {
          contentType: 'text',
          text: { value: '' },
          ...contentItem
        };
      } else if (contentItem.contentType === 'images') {
        this.templateModel.templateSettings.contentItem = {
          contentType: 'images',
          imagesTemplate: {
            imageTemplates: [this.defaultImageTemplate],
            numImages: 1
          },
          ...contentItem
        };
      } else if (contentItem.contentType === 'video') {
        this.templateModel.templateSettings.contentItem = {
          contentType: 'video',
          videoTemplate: this.defaultVideoTemplate,
          ...contentItem
        };
      } else {
        this.templateModel.templateSettings.contentItem = contentItem;
      }
    }
  }
}
