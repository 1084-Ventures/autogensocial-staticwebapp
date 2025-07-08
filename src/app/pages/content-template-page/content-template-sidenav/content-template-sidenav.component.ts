import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-content-template-sidenav',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule, MatButtonModule],
  templateUrl: './content-template-sidenav.component.html',
  styleUrls: ['./content-template-sidenav.component.scss']
})
export class ContentTemplateSidenavComponent {
  @Input() contentTemplates: any[] = [];
  @Input() selectedTemplate: any = null;
  @Output() selectTemplate = new EventEmitter<any>();
  @Output() addTemplate = new EventEmitter<void>();

  onSelect(template: any) {
    this.selectTemplate.emit(template);
  }

  onAddTemplate() {
    this.addTemplate.emit();
  }
}
