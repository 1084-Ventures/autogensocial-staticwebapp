import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentImageEditorComponent } from '../content-image-editor/content-image-editor.component';
import { ContentMultiImageEditorComponent } from '../content-multi-image-editor/content-multi-image-editor.component';
import { ContentVideoEditorComponent } from '../content-video-editor/content-video-editor.component';
import type { components } from '../../../../generated/models';
import { MaterialModule } from '../../../../material.module';

@Component({
  selector: 'app-content-item-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, ContentImageEditorComponent, ContentMultiImageEditorComponent, ContentVideoEditorComponent],
  template: `
    <section class="form-section">
      <h3 mat-subheader>Content Item</h3>
      <ng-container [ngSwitch]="contentItem.type">
        <app-content-image-editor *ngSwitchCase="'image'" [(image)]="contentItem"></app-content-image-editor>
        <app-content-multi-image-editor *ngSwitchCase="'multiImage'" [(multiImage)]="contentItem"></app-content-multi-image-editor>
        <app-content-video-editor *ngSwitchCase="'video'" [(video)]="contentItem"></app-content-video-editor>
        <div *ngSwitchDefault>
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Text</mat-label>
            <textarea
              matInput
              [ngModel]="contentItem.text?.value"
              (ngModelChange)="onTextValueChange($event)"
              [disabled]="!contentItem.text"
            ></textarea>
          </mat-form-field>
        </div>
      </ng-container>
    </section>
  `
})
export class ContentItemEditorComponent {
  @Input() contentItem!: components["schemas"]["ContentItem"];
  @Output() contentItemChange = new EventEmitter<components["schemas"]["ContentItem"]>();

  onChange() {
    this.contentItemChange.emit(this.contentItem);
  }

  onTextValueChange(value: string) {
    if (this.contentItem.text) {
      this.contentItem.text.value = value;
      this.onChange();
    }
  }
}

