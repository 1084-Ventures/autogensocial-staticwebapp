import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { MediaService } from '../../core/services/media.service';
import type { components } from '../../../../api/generated/models';
import { MediaUploadFormComponent } from '../../components/media-upload-form/media-upload-form.component';
import { FormsModule } from '@angular/forms';

type MediaDocument = components["schemas"]["MediaDocument"];
type MediaUpdate = components["schemas"]["MediaUpdate"];

@Component({
  selector: 'app-upload-page',
  imports: [CommonModule, MaterialModule, FormsModule, MediaUploadFormComponent],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.scss'
})
export class UploadPageComponent implements OnDestroy {
  brandId: string | null = null;
  mediaList: MediaDocument[] = [];
  selectedMedia: MediaDocument | null = null;
  isUploading = false;
  showUploadForm = false;
  tagsString: string = '';
  feedbackMessage: string | null = null;
  private subscription: any;

  constructor(
    private navigationService: NavigationService,
    private mediaService: MediaService
  ) {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => {
        this.brandId = id;
        if (id) this.loadMedia();
      }
    );
  }

  loadMedia() {
    if (!this.brandId) return;
    this.mediaService.getMediaByBrand(this.brandId).subscribe({
      next: (media) => {
        this.mediaList = media;
        this.selectedMedia = null;
        this.feedbackMessage = null;
      },
      error: () => {
        this.feedbackMessage = 'Error loading media.';
      }
    });
  }

  selectMedia(media: MediaDocument) {
    this.selectedMedia = media;
    this.showUploadForm = false;
    // tagsString is comma-separated for UI, but tags is string[] in model
    this.tagsString = (media.mediaMetadata?.tags || []).join(', ');
  }

  openUploadForm() {
    this.selectedMedia = null;
    this.showUploadForm = true;
    this.tagsString = '';
    this.feedbackMessage = null;
  }

  submitMediaEditForm(form: any) {
    if (!this.selectedMedia) return;
    // Convert tagsString (comma-separated) to string[]
    const tags = (this.tagsString || '').split(',').map((t: string) => t.trim()).filter((t: string) => !!t);
    const update: MediaUpdate = {
      id: this.selectedMedia.id,
      metadata: this.selectedMedia.metadata,
      mediaMetadata: {
        ...this.selectedMedia.mediaMetadata,
        fileName: this.selectedMedia.mediaMetadata?.fileName || '',
        tags,
        description: this.selectedMedia.mediaMetadata?.description || '',
        cognitiveData: this.selectedMedia.mediaMetadata?.cognitiveData || {}
      }
    };
    this.onUpdateMedia(update);
  }

  onUploadSuccess(media: MediaDocument) {
    this.showUploadForm = false;
    this.isUploading = false;
    this.feedbackMessage = 'Upload successful!';
    this.loadMedia();
    this.selectedMedia = media;
    this.tagsString = (media.mediaMetadata?.tags || []).join(', ');
  }

  onUpdateMedia(update: MediaUpdate) {
    if (!this.selectedMedia) return;
    this.isUploading = true;
    this.mediaService.updateMedia(this.selectedMedia.id, update).subscribe({
      next: (updated) => {
        this.selectedMedia = updated;
        this.feedbackMessage = 'Media updated successfully!';
        this.loadMedia();
        this.tagsString = (updated.mediaMetadata?.tags || []).join(', ');
        this.isUploading = false;
      },
      error: () => {
        this.feedbackMessage = 'Error updating media.';
        this.isUploading = false;
      }
    });
  }

  onDeleteMedia() {
    if (!this.selectedMedia) return;
    this.isUploading = true;
    this.mediaService.deleteMedia(this.selectedMedia.id).subscribe({
      next: () => {
        this.selectedMedia = null;
        this.feedbackMessage = 'Media deleted successfully!';
        this.loadMedia();
        this.tagsString = '';
        this.isUploading = false;
      },
      error: () => {
        this.feedbackMessage = 'Error deleting media.';
        this.isUploading = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
