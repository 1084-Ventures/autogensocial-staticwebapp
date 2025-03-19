import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, FormsModule], // Add FormsModule to imports
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  @Input() selectedBrand: string | null = null;
  @Output() brandSelected = new EventEmitter<string>();
  
  brands = ['Brand 1', 'Brand 2', 'Brand 3']; // Temporary sample data
  showForm = false;
  newBrandName = '';

  constructor(private dialog: MatDialog) {}

  toggleForm() {
    this.showForm = !this.showForm;
  }

  submitBrand() {
    if (this.newBrandName.trim()) {
      this.brands.push(this.newBrandName.trim());
      this.newBrandName = '';
      this.showForm = false;
    }
  }

  selectBrand(brand: string) {
    this.brandSelected.emit(brand);
  }
}
