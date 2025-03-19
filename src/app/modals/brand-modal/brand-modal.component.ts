import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-brand-modal',
  templateUrl: './brand-modal.component.html',
  styleUrls: ['./brand-modal.component.scss'],
  imports: [MaterialModule] // Import MaterialModule here
})
export class BrandModalComponent {
  constructor(public dialogRef: MatDialogRef<BrandModalComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}
