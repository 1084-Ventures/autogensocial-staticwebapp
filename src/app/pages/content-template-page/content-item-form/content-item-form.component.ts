import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
// ContentType is not exported as a type from OpenAPI, so define it here to match the enum in ContentItem.yaml
export type ContentType = 'text' | 'images' | 'video';
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
  @Input() contentType!: ContentType;
  @Input() disabled = false;


  // Getter for the FormArray of imageTemplates inside imagesTemplate
  get imageTemplates(): FormArray | null {
    const imagesTemplateGroup = this.formGroup.get('imagesTemplate') as FormGroup;
    return imagesTemplateGroup?.get('imageTemplates') as FormArray;
  }

  get dimensionsGroup(): FormGroup | null {
    const ctrl = this.formGroup.get('dimensions');
    return ctrl instanceof FormGroup ? ctrl : null;
  }

  dimensionsGroupFor(img: any): FormGroup | null {
    const ctrl = img.get('dimensions');
    return ctrl instanceof FormGroup ? ctrl : null;
  }


  // Add a new image template to the FormArray
  addImageTemplate() {
    if (this.imageTemplates) {
      this.imageTemplates.push(new FormGroup({
        mediaType: new FormControl('color', { nonNullable: true }),
        setUrl: new FormControl('', { nonNullable: true }),
        aspectRatio: new FormControl('', { nonNullable: true }),
        format: new FormControl('', { nonNullable: true })
      }));
    }
  }

  // Remove an image template at the given index
  removeImageTemplate(index: number) {
    if (this.imageTemplates) {
      this.imageTemplates.removeAt(index);
    }
  }
}
