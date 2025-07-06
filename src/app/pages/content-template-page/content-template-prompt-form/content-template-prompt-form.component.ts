

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-prompt-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './content-template-prompt-form.component.html',
  styleUrls: ['./content-template-prompt-form.component.scss']
})
export class ContentTemplatePromptFormComponent {

  @Input() formGroup!: FormGroup;


  get variables(): FormArray {
    return this.formGroup.get('variables') as FormArray;
  }


  addVariable(variable?: components['schemas']['PromptVariable']) {
    // The parent FormGroup should be created with FormBuilder, so we can use FormArray's push method
    this.variables.push(
      new FormGroup({
        name: new (Object.getPrototypeOf(this.formGroup.get('userPrompt'))).constructor('', []),
        values: new (Object.getPrototypeOf(this.formGroup.get('userPrompt'))).constructor([], []),
        description: new (Object.getPrototypeOf(this.formGroup.get('userPrompt'))).constructor('', [])
      })
    );
    // If variable is provided, patch its values
    if (variable) {
      this.variables.at(this.variables.length - 1).patchValue({
        name: variable.name || '',
        values: variable.values || [],
        description: variable.description || ''
      });
    }
  }



  removeVariable(index: number) {
    this.variables.removeAt(index);
  }


  /**
   * Handles input for variable values (comma separated string to string[])
   * @param event Input event
   * @param index Index of the variable in the FormArray
   */

  onVariableValuesInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const values = input.value.split(',').map(v => v.trim()).filter(Boolean);
    const variableGroup = this.variables.at(index) as FormGroup;
    variableGroup.patchValue({ values });
  }


  // No submit/cancel here; handled by parent
}
