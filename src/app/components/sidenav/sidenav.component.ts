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
  
  brands: { id: any; brandName: string }[] = []; // Initialize with correct type
  showForm = false;
  newBrandName = '';

    // Define apiUrl using environment.apiBaseUrl
    private apiUrl = environment.apiBaseUrl;

  constructor(private dialog: MatDialog, private http: HttpClient) {}

  ngOnInit(): void {
    const url = `${this.apiUrl}/brand_management`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        console.log('Fetched brands:', data);
        // Store both id and brandName
        this.brands = data.map(brand => ({
          id: brand.id,
          brandName: brand.brandName
        }));
      },
      error: (err) => console.error('Error fetching brands:', err)
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  submitBrand() {
    if (this.newBrandName.trim()) {
      const brandName = this.newBrandName.trim();
      const url = `${this.apiUrl}/brand_management`;
      this.http.post<{ id: any }>(url, { brandName }).subscribe({
        next: (response) => {
          console.log('Brand created:', response);
          this.brands.push({ id: response.id, brandName });
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
