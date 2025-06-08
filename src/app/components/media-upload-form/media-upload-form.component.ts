import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MediaService } from '../../services/media.service';
import { MediaDocument } from '../../../../api/src/models/media.model';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-media-upload-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatProgressBarModule, FormsModule, ReactiveFormsModule],
  templateUrl: './media-upload-form.component.html',
})
export class MediaUploadFormComponent {
  @Input() brandId!: string;
  @Output() uploadSuccess = new EventEmitter<MediaDocument>();
  form: FormGroup;
  file: File | null = null;
  uploading = false;
  fileOver = false;

  constructor(private fb: FormBuilder, private mediaService: MediaService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      tags: [''],
      description: [''],
      file: [null, Validators.required]
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.file = file;
    this.form.patchValue({ file });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.fileOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.fileOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.fileOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.file = file;
      this.form.patchValue({ file });
    }
  }

  removeFile() {
    this.file = null;
    this.form.patchValue({ file: null });
  }

  submit() {
    if (!this.form.valid || !this.file) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('brandId', this.brandId);
    formData.append('file', this.file);
    formData.append('name', this.form.value.name);
    formData.append('tags', this.form.value.tags);
    formData.append('description', this.form.value.description);
    this.mediaService.uploadMedia(formData).subscribe({
      next: (media) => {
        this.uploading = false;
        this.uploadSuccess.emit(media);
        this.form.reset();
        this.file = null;
      },
      error: () => {
        this.uploading = false;
      }
    });
  }
}
