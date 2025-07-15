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
    this.mediaService.getMediaByBrand(this.brandId).subscribe(media => {
      this.mediaList = media;
      this.selectedMedia = null;
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
    this.loadMedia();
    this.selectedMedia = media;
    this.tagsString = (media.mediaMetadata?.tags || []).join(', ');
  }

  onUpdateMedia(update: MediaUpdate) {
    if (!this.selectedMedia) return;
    this.mediaService.updateMedia(this.selectedMedia.id, update).subscribe(updated => {
      this.selectedMedia = updated;
      this.loadMedia();
      this.tagsString = (updated.mediaMetadata?.tags || []).join(', ');
    });
  }

  onDeleteMedia() {
    if (!this.selectedMedia) return;
    this.mediaService.deleteMedia(this.selectedMedia.id).subscribe(() => {
      this.selectedMedia = null;
      this.loadMedia();
      this.tagsString = '';
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
