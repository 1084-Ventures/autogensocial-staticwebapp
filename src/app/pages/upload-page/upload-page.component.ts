import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { MediaService } from '../../services/media.service';
import { MediaDocument, MediaUpdate } from '../../../../api/src/models/media.model';
import { MediaUploadFormComponent } from '../../components/media-upload-form/media-upload-form.component';
import { FormsModule } from '@angular/forms';

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
    this.tagsString = (media.metadata.tags || []).map((t: any) => t.name).join(', ');
  }

  openUploadForm() {
    this.selectedMedia = null;
    this.showUploadForm = true;
    this.tagsString = '';
  }

  submitMediaEditForm(form: any) {
    if (!this.selectedMedia) return;
    const tags = this.tagsString.split(',').map(t => t.trim()).filter(t => t).map(t => ({ name: t, confidence: 1 }));
    const update: MediaUpdate = {
      metadata: {
        fileName: this.selectedMedia.metadata.fileName,
        tags,
        description: this.selectedMedia.metadata.description
      }
    };
    this.onUpdateMedia(update);
  }

  onUploadSuccess(media: MediaDocument) {
    this.showUploadForm = false;
    this.loadMedia();
    this.selectedMedia = media;
    this.tagsString = (media.metadata.tags || []).map((t: any) => t.name).join(', ');
  }

  onUpdateMedia(update: MediaUpdate) {
    if (!this.selectedMedia) return;
    this.mediaService.updateMedia(this.selectedMedia.id, update).subscribe(updated => {
      this.selectedMedia = updated;
      this.loadMedia();
      this.tagsString = (updated.metadata.tags || []).map((t: any) => t.name).join(', ');
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
