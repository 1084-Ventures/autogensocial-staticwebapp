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
  @Input() templateModel: any = {};
  @Output() submitForm = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  onSubmit() {
    this.submitForm.emit();
  }
  onCancel() {
    this.cancelForm.emit();
  }
  // Initialization logic for info, schedule, settings, and contentItem is now handled by child components

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
      this.templateModel.templateSettings.contentItem = contentItem;
    }
  }
}
