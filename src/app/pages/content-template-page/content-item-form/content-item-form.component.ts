import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { components } from '../../../generated/models';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-content-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './content-item-form.component.html',
  styleUrls: ['./content-item-form.component.scss']
})
export class ContentItemFormComponent {
  @Input() formGroup!: FormGroup;
  @Input() contentType!: components["schemas"]["ContentType"];
  @Input() disabled = false;

  get images(): FormArray | null {
    return this.formGroup.get('images') as FormArray;
  }

  get dimensionsGroup(): FormGroup | null {
    const ctrl = this.formGroup.get('dimensions');
    return ctrl instanceof FormGroup ? ctrl : null;
  }

  dimensionsGroupFor(img: any): FormGroup | null {
    const ctrl = img.get('dimensions');
    return ctrl instanceof FormGroup ? ctrl : null;
  }

  addImage() {
    if (this.images) {
      this.images.push(new FormGroup({
        setUrl: new FormControl('', { nonNullable: true }),
        resolution: new FormControl('', { nonNullable: true }),
        format: new FormControl('', { nonNullable: true }),
        dimensions: new FormGroup({
          width: new FormControl(null),
          height: new FormControl(null),
          aspectRatio: new FormControl('')
        })
      }));
    }
  }

  removeImage(index: number) {
    if (this.images) {
      this.images.removeAt(index);
    }
  }
}
