import { Component, Input, Output, EventEmitter } from '@angular/core';
import type { components } from '../../../generated/models';

type ContentGenerationTemplateDocument = components["schemas"]["ContentGenerationTemplateDocument"];

import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-content-template-sidenav',
  imports: [CommonModule, MaterialModule],
  templateUrl: './content-template-sidenav.component.html',
  styleUrls: ['./content-template-sidenav.component.scss']
})
export class ContentTemplateSidenavComponent {
  @Input() templateList: ContentGenerationTemplateDocument[] = [];
  @Input() selectedTemplate: ContentGenerationTemplateDocument | null = null;
  @Output() selectTemplate = new EventEmitter<ContentGenerationTemplateDocument>();
  @Output() addTemplate = new EventEmitter<void>();

  onSelect(template: ContentGenerationTemplateDocument) {
    this.selectTemplate.emit(template);
  }

  onAdd() {
    this.addTemplate.emit();
  }
}
