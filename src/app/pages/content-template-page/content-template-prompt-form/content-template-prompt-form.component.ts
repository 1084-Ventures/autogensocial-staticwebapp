  // Only one implementation of getValuesStringControl should exist


import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-prompt-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    // MatChipsModule, // No longer needed
    // MatAutocompleteModule, // No longer needed
  ],
  templateUrl: './content-template-prompt-form.component.html',
  styleUrls: ['./content-template-prompt-form.component.scss']
})
export class ContentTemplatePromptFormComponent {

  @Input() formGroup!: FormGroup;


  get variables(): FormArray {
    return this.formGroup.get('variables') as FormArray;
  }

  // Helper to sync valuesString <-> values array
  ngAfterViewInit() {
    this.variables.controls.forEach((ctrl, i) => {
      this.setupValuesStringSync(ctrl as FormGroup);
    });
    this.variables.valueChanges?.subscribe(() => {
      this.variables.controls.forEach((ctrl, i) => {
        this.setupValuesStringSync(ctrl as FormGroup);
      });
    });
  }

  setupValuesStringSync(ctrl: FormGroup) {
    if (!ctrl.get('valuesString')) {
      const valuesString = new FormControl((ctrl.get('values')?.value || []).join(', '));
      ctrl.addControl('valuesString', valuesString);
      valuesString.valueChanges.subscribe((val: string) => {
        const arr = val.split(',').map(v => v.trim()).filter(Boolean);
        ctrl.get('values')?.setValue(arr, { emitEvent: false });
      });
      ctrl.get('values')?.valueChanges.subscribe((arr: string[]) => {
        valuesString.setValue((arr || []).join(', '), { emitEvent: false });
      });
    }
  }


  addVariable(variable?: components['schemas']['PromptVariable']) {
    const group = new FormGroup({
      name: new FormControl('', []),
      values: new FormControl<string[]>([], [])
    });
    this.setupValuesStringSync(group);
    this.variables.push(group);
    if (variable) {
      group.patchValue({
        name: variable.name || '',
        values: variable.values || []
      });
    }
  }



  removeVariable(index: number) {
    this.variables.removeAt(index);
  }

  // Removed duplicate getValuesStringControl implementation


  /**
   * Handles input for variable values (comma separated string to string[])
   * @param event Input event
   * @param index Index of the variable in the FormArray
   */


  /**
   * Material chip input for variable values
   */
  addValue(event: any, index: number) {
    const input = event.input;
    const value = event.value?.trim();
    if (value) {
      const variableGroup = this.variables.at(index) as FormGroup;
      const values = variableGroup.get('values')?.value || [];
      variableGroup.patchValue({ values: [...values, value] });
    }
    if (input) {
      input.value = '';
    }
  }

  removeValue(index: number, valueIndex: number) {
    const variableGroup = this.variables.at(index) as FormGroup;
    const values = variableGroup.get('values')?.value || [];
    if (values.length > valueIndex) {
      values.splice(valueIndex, 1);
      variableGroup.patchValue({ values: [...values] });
    }
  }


  // No submit/cancel here; handled by parent
  getValuesStringControl(i: number): FormControl {
    return (this.variables.at(i).get('valuesString') as FormControl) ?? new FormControl('');
  }
}
