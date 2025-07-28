import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import type { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-visual-style-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-visual-style-form.component.html',
  styleUrls: ['./content-template-visual-style-form.component.scss']
})
export class ContentTemplateVisualStyleFormComponent {
  // Fonts list matching specs/resources/fonts.json
  fonts = [
    { name: 'Comic Neue' },
    { name: 'Lato' },
    { name: 'Montserrat' },
    { name: 'Open Sans' },
    { name: 'Pacifico' },
    { name: 'Roboto' }
  ];
  onOutlineColorChange(color: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    const outline = { ...this.visualStyle.textStyle?.outline, color };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, outline };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onOutlineWidthChange(width: number) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    const outline = { ...this.visualStyle.textStyle?.outline, width };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, outline };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onAlignmentChange(alignment: 'left' | 'center' | 'right') {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, alignment };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onTransparencyChange(transparency: number) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, transparency };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onOverlayColorChange(color: string) {
    if (!this.visualStyle) return;
    const overlayBox = { ...this.visualStyle.overlayBox, color };
    this.visualStyle.overlayBox = overlayBox;
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onOverlayTransparencyChange(transparency: number) {
    if (!this.visualStyle) return;
    const overlayBox = { ...this.visualStyle.overlayBox, transparency };
    this.visualStyle.overlayBox = overlayBox;
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onOverlayVerticalChange(verticalLocation: 'top' | 'middle' | 'bottom') {
    if (!this.visualStyle) return;
    const overlayBox = { ...this.visualStyle.overlayBox, verticalLocation };
    this.visualStyle.overlayBox = overlayBox;
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onOverlayHorizontalChange(horizontalLocation: 'left' | 'middle' | 'right') {
    if (!this.visualStyle) return;
    const overlayBox = { ...this.visualStyle.overlayBox, horizontalLocation };
    this.visualStyle.overlayBox = overlayBox;
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onBackgroundColorChange(backgroundColor: string) {
    if (!this.visualStyle) return;
    this.visualStyle.backgroundColor = backgroundColor;
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  addTheme() {
    // This should emit an event to parent to add a new theme to the themes array
    // For now, emit a blank theme object
    this.visualStyleChange.emit({ textStyle: { font: {}, transparency: 1 } });
  }
  // Accept a single theme object for child usage
  @Input() visualStyle?: components["schemas"]["VisualStyle"];
  @Output() visualStyleChange = new EventEmitter<components["schemas"]["VisualStyle"]>();

  private ensureInitialized() {
    if (!this.visualStyle) return;
    if (!this.visualStyle.textStyle) {
      this.visualStyle.textStyle = { font: {}, transparency: 1 };
    } else {
      if (!this.visualStyle.textStyle.font) {
        this.visualStyle.textStyle.font = {};
      }
      if (typeof this.visualStyle.textStyle.transparency !== 'number') {
        this.visualStyle.textStyle.transparency = 1;
      }
    }
  }

  onFontFamilyChange(family: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    const font = { ...this.visualStyle.textStyle!.font, family };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, font };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onFontSizeChange(size: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    const font = { ...this.visualStyle.textStyle!.font, size };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, font };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onFontWeightChange(weight: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    // Only allow 'normal' or 'bold' as type
    const validWeight: 'normal' | 'bold' = weight === 'bold' ? 'bold' : 'normal';
    const font = { ...this.visualStyle.textStyle!.font, weight: validWeight };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, font };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onFontStyleChange(style: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    // Only allow 'normal' or 'italic' as type
    const validStyle: 'normal' | 'italic' = style === 'italic' ? 'italic' : 'normal';
    const font = { ...this.visualStyle.textStyle!.font, style: validStyle };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, font };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }

  onFontColorChange(color: string) {
    this.ensureInitialized();
    if (!this.visualStyle) return;
    const font = { ...this.visualStyle.textStyle!.font, color };
    this.visualStyle.textStyle = { ...this.visualStyle.textStyle!, font };
    this.visualStyleChange.emit({ ...this.visualStyle });
  }
}
