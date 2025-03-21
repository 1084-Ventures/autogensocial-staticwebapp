import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    RouterModule, 
    FormsModule, 
    HttpClientModule
  ], 
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  @Input() selectedBrand: string | null = null;
  @Output() brandSelected = new EventEmitter<string>();
  
  brands = ['Brand 1', 'Brand 2', 'Brand 3']; // Temporary sample data
  showForm = false;
  newBrandName = '';

    // Define apiUrl using environment.apiBaseUrl
    private apiUrl = environment.apiBaseUrl;

  constructor(private dialog: MatDialog, private http: HttpClient) {}

  toggleForm() {
    this.showForm = !this.showForm;
  }

  submitBrand() {
    if (this.newBrandName.trim()) {
      const brandName = this.newBrandName.trim();
      const url = `${this.apiUrl}/brand_management`;
      this.http.post(url, { brandName }).subscribe({
        next: (response) => {
          console.log('Brand created:', response);
          this.brands.push(brandName);
          this.newBrandName = '';
          this.showForm = false;
        },
        error: (error) => console.error('Error creating brand:', error)
      });
    }
  }

  selectBrand(brand: string) {
    this.brandSelected.emit(brand);
  }
}
