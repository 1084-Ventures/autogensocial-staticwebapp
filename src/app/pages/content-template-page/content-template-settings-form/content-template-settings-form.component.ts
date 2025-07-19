import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-settings-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-settings-form.component.html',
  styleUrls: ['./content-template-settings-form.component.scss']
})
export class ContentTemplateSettingsFormComponent implements OnChanges {
  ngOnInit() {
    // Ensure settings is always initialized with required structure
    if (!this.settings) {
      this.settings = {
        promptTemplate: {
          userPrompt: '',
          variables: []
        }
      } as components["schemas"]["TemplateSettings"];
      this.settingsChange.emit(this.settings);
    } else {
      // Ensure promptTemplate exists
      if (!this.settings.promptTemplate) {
        this.settings.promptTemplate = { userPrompt: '', variables: [] };
        this.settingsChange.emit(this.settings);
      }
      // Ensure variables exists
      if (!this.settings.promptTemplate.variables) {
        this.settings.promptTemplate.variables = [];
        this.settingsChange.emit(this.settings);
      }
    }
  }
  @Input() settings: components["schemas"]["TemplateSettings"] | undefined;
  @Output() settingsChange = new EventEmitter<components["schemas"]["TemplateSettings"]>();

  private _variables: { name?: string; values?: string[]; valuesString?: string }[] = [];

  ngOnChanges() {
    this._variables = (this.settings?.promptTemplate?.variables || []).map(v => ({
      ...v,
      valuesString: (v.values || []).join(', ')
    }));
  }

  get prompt(): string {
    return this.settings?.promptTemplate?.userPrompt || '';
  }
  set prompt(value: string) {
    if (!this.settings) return;
    this.settings = {
      ...this.settings,
      promptTemplate: {
        ...this.settings.promptTemplate,
        userPrompt: value,
        variables: this.settings.promptTemplate?.variables || []
      }
    };
    this.settingsChange.emit(this.settings);
  }

  get variables(): { name?: string; values?: string[]; valuesString?: string }[] {
    return this._variables;
  }
  set variables(vars: { name?: string; values?: string[]; valuesString?: string }[]) {
    if (!this.settings) return;
    this._variables = vars;
    const mapped = vars.map(v => ({
      name: v.name,
      values: v.valuesString ? v.valuesString.split(',').map(s => s.trim()).filter(Boolean) : []
    }));
    this.settings = {
      ...this.settings,
      promptTemplate: {
        ...this.settings.promptTemplate,
        variables: mapped,
        userPrompt: this.settings.promptTemplate?.userPrompt || ''
      }
    };
    this.settingsChange.emit(this.settings);
  }

  updateVariable(index: number, field: 'name' | 'valuesString', value: string) {
    const vars = [...this._variables];
    vars[index] = { ...vars[index], [field]: value };
    this.variables = vars;
  }

  addVariable() {
    this.variables = [...this.variables, { name: '', valuesString: '' }];
  }

  removeVariable(index: number) {
    const vars = [...this.variables];
    vars.splice(index, 1);
    this.variables = vars;
  }

}
