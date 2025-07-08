import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-content-template-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './content-template-info-form.component.html',
  styleUrls: ['./content-template-info-form.component.scss']
})
export class ContentTemplateInfoFormComponent {
  @Input() formGroup!: FormGroup;
}
