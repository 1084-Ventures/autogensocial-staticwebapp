import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NavigationService, BrandRoute } from '../../services/navigation.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

// Add this interface to match the backend response
interface BrandNameResponse {
  id: string;
  name: string;
}

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
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input() selectedBrand: string | null = null;
  @Output() brandSelected = new EventEmitter<string>();
  
  brands: BrandNameResponse[] = []; // Update the brands type to use BrandNameResponse
  showForm = false;
  newBrandName = '';

  // Define apiUrl using environment.apiBaseUrl
  private apiUrl = environment.apiBaseUrl;
  private subscription: Subscription;
  selectedBrandId: string | null = null;

  constructor(
    private dialog: MatDialog, 
    private http: HttpClient, 
    private navigationService: NavigationService,
    private snackBar: MatSnackBar
  ) {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      brandId => this.selectedBrandId = brandId
    );
  }

  ngOnInit(): void {
    this.reloadBrands();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  submitBrand() {
    if (this.newBrandName.trim()) {
      const brandCreate = {
        name: this.newBrandName.trim()
      };

      const url = `${this.apiUrl}/brand_management`;
      this.http.post<BrandNameResponse>(url, brandCreate).subscribe({
        next: (response) => {
          if (!response || !response.name) {
            this.snackBar.open('Error: Invalid response from server', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open('Brand created successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.brands = [...this.brands, response]; // Immediately add new brand
            this.newBrandName = '';
            this.showForm = false;
            this.reloadBrands(); // Refresh the full list
          }
        },
        error: (error) => {
          console.error('Error creating brand:', error);
          this.snackBar.open('Failed to create brand', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private reloadBrands() {
    const url = `${this.apiUrl}/brand_management`;
    this.http.get<BrandNameResponse[]>(url).subscribe({
      next: (brands) => {
        console.log('Fetched brands:', brands);
        this.brands = brands;
      },
      error: (err) => console.error('Error fetching brands:', err)
    });
  }

  selectBrand(brand: BrandNameResponse, route: BrandRoute = 'brand_details') {
    this.brandSelected.emit(brand.name);
    this.navigationService.navigateToBrand(brand.id, route);
  }
}
