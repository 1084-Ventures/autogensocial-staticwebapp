import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../material.module';
// import type { components } from '../../../generated/models';

type Video = any;
type MediaType = any;

@Component({
  selector: 'app-content-video-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './content-video-editor.component.html',
  styleUrls: ['./content-video-editor.component.scss']
})
export class ContentVideoEditorComponent {
  @Input() video: Video | undefined;
  @Input() videoFormats: { value: string; label: string }[] = [
    { value: 'mp4', label: 'MP4' },
    { value: 'webm', label: 'WebM' },
    { value: 'mov', label: 'MOV' },
    { value: 'avi', label: 'AVI' }
  ];
  @Input() aspectRatios: { value: string; label: string }[] = [
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '9:16', label: '9:16 (Story)' }
  ];
  @Output() videoChange = new EventEmitter<Video>();

  mediaTypes: MediaType[] = ['color', 'set', 'uploaded', 'online'];

  onVideoChange() {
    if (this.video) {
      this.videoChange.emit(this.video);
    }
  }
}
