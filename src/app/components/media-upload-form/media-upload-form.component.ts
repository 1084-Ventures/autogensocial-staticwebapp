import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MediaService } from '../../core/services/media.service';
import { components } from '../../generated/models';
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
  @Output() uploadSuccess = new EventEmitter<components['schemas']['MediaDocument']>();
  form: FormGroup;
  file: File | null = null;
  uploading = false;
  fileOver = false;
  analyzing = false;
  analyzeError: string | null = null;
  analyzedCognitiveData: components['schemas']['MediaAnalyze'] | null = null;

  constructor(private fb: FormBuilder, private mediaService: MediaService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      tags: [''], // comma-separated string in UI, string[] for backend
      description: [''],
      // Add fields for all cognitive metadata (for hidden/patching)
      categories: [''],
      objects: [''],
      brands: [''],
      people: [''],
      ocrText: [''],
      caption: [''],
      denseCaptions: [''],
      cognitiveData: [''],
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

  async analyzeFile() {
    if (!this.file) return;
    this.analyzing = true;
    this.analyzeError = null;
    try {
      const base64 = await this.fileToBase64(this.file);
      this.mediaService.analyzeMedia(base64).subscribe({
        next: (result: components['schemas']['MediaAnalyze']) => {
          this.form.patchValue({
            name: result.caption?.text || '',
            tags: (result.tags || []).map(t => t.name).filter(Boolean).join(', '),
            description: result.description || '',
            // ...other fields unchanged...
            cognitiveData: JSON.stringify(result.cognitiveData || {})
          });
          this.analyzedCognitiveData = result;
          this.analyzing = false;
        },
        error: (err: any) => {
          this.analyzeError = err?.error?.error || 'Failed to analyze image.';
          this.analyzing = false;
        }
      });
    } catch (e) {
      this.analyzeError = 'Could not read file.';
      this.analyzing = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  submit() {
    if (!this.form.valid || !this.file) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('brandId', this.brandId);
    formData.append('file', this.file);
    formData.append('name', this.form.value.name);
    // Convert tags from comma-separated string to string[] for backend
    const tagsArray = (this.form.value.tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => !!t);
    formData.append('tags', tagsArray.join(','));
    formData.append('description', this.form.value.description);
    // Always include cognitiveData (parsed from form or empty)
    let cognitiveData = {};
    try {
      cognitiveData = this.form.value.cognitiveData ? JSON.parse(this.form.value.cognitiveData) : {};
    } catch {
      cognitiveData = {};
    }
    formData.append('cognitiveData', JSON.stringify(cognitiveData));
    this.mediaService.uploadMedia(formData).subscribe({
      next: (media) => {
        this.uploading = false;
        this.uploadSuccess.emit(media);
        this.form.reset();
        this.file = null;
        this.analyzedCognitiveData = null;
      },
      error: () => {
        this.uploading = false;
      }
    });
  }
}
