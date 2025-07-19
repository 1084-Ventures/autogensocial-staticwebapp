import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-info-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-info-form.component.html',
  styleUrls: ['./content-template-info-form.component.scss']
})
export class ContentTemplateInfoFormComponent {
  ngOnInit() {
    // Ensure info is always initialized with required structure
    if (!this.info) {
      this.info = {
        name: '',
        description: '',
        socialAccounts: []
      } as components["schemas"]["TemplateInfo"];
      this.infoChange.emit(this.info);
    } else {
      // Ensure name exists
      if (!('name' in this.info) || this.info.name === undefined) {
        this.info.name = '';
        this.infoChange.emit(this.info);
      }
      // Ensure description exists
      if (!('description' in this.info) || this.info.description === undefined) {
        this.info.description = '';
        this.infoChange.emit(this.info);
      }
      // Ensure socialAccounts exists
      if (!('socialAccounts' in this.info) || this.info.socialAccounts === undefined) {
        this.info.socialAccounts = [];
        this.infoChange.emit(this.info);
      }
    }
  }
  // Manually define platform options to match the allowed values from the Platform type
  socialAccountOptions = ["instagram", "facebook", "x", "youtube", "tiktok"];
  @Input() info: components["schemas"]["TemplateInfo"] | undefined;
  @Output() infoChange = new EventEmitter<components["schemas"]["TemplateInfo"]>();

  onFieldChange(field: keyof components["schemas"]["TemplateInfo"], value: any) {
    if (!this.info) return;
    this.info = { ...this.info, [field]: value };
    this.infoChange.emit(this.info);
  }
}
