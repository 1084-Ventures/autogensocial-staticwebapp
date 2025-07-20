import { Component, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-settings-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, MatChipsModule, MatFormFieldModule, MatIconModule],
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

  private _variables: { name?: string; values?: string[] }[] = [];

  ngOnChanges() {
    this._variables = (this.settings?.promptTemplate?.variables || []).map(v => ({
      name: v.name,
      values: v.values ? [...v.values] : []
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

  get variables(): { name?: string; values?: string[] }[] {
    return this._variables;
  }
  set variables(vars: { name?: string; values?: string[] }[]) {
    if (!this.settings) return;
    this._variables = vars;
    const mapped = vars.map(v => ({
      name: v.name,
      values: v.values ? [...v.values] : []
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

  updateVariableName(index: number, value: string) {
    const vars = [...this._variables];
    vars[index] = { ...vars[index], name: value };
    this.variables = vars;
  }

  addVariable() {
    this.variables = [...this.variables, { name: '', values: [] }];
  }

  removeVariable(index: number) {
    const vars = [...this.variables];
    vars.splice(index, 1);
    this.variables = vars;
  }

  addVariableValue(index: number, value: string) {
    if (!value || !value.trim()) return;
    const vars = [...this._variables];
    if (!vars[index].values) vars[index].values = [];
    if (!vars[index].values.includes(value.trim())) {
      vars[index].values.push(value.trim());
      this.variables = vars;
    }
  }

  removeVariableValue(varIndex: number, valueIndex: number) {
    const vars = [...this._variables];
    if (vars[varIndex].values) {
      vars[varIndex].values.splice(valueIndex, 1);
      this.variables = vars;
    }
  }

  // ...existing code...

  handleChipInputTokenEnd(i: number, event: any, chipInput: HTMLInputElement) {
    const values = event.value.split(',').map((v: string) => v.trim()).filter(Boolean);
    values.forEach((val: string) => {
      if (val && !this.variables[i].values?.includes(val)) {
        this.addVariableValue(i, val);
      }
    });
    event.input.value = '';
    // Use requestAnimationFrame for more reliable focus after chip creation
    requestAnimationFrame(() => chipInput.focus());
  }

  handleChipInputPaste(i: number, pasteEvent: ClipboardEvent, chipInput: HTMLInputElement) {
    pasteEvent.preventDefault();
    const paste = pasteEvent.clipboardData?.getData('text') || '';
    const values = paste.split(',').map(v => v.trim()).filter(Boolean);
    values.forEach(val => {
      if (val && !this.variables[i].values?.includes(val)) {
        this.addVariableValue(i, val);
      }
    });
    chipInput.value = '';
    setTimeout(() => chipInput.focus());
  }

  handleChipInputBackspace(i: number, chipInput: HTMLInputElement) {
    if (chipInput.value === '' && this.variables[i].values?.length) {
      this.removeVariableValue(i, this.variables[i].values.length - 1);
    }
  }

}
