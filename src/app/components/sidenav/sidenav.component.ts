import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NavigationService, BrandRoute } from '../../services/navigation.service';
import { BrandService } from '../../services/brand.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { Subscription } from 'rxjs';
import type { components } from '../../generated/models';

export type BrandDocument = components['schemas']['BrandDocument'];
export type PaginationParams = components['parameters']['pagination'];

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
  @Output() brandSelected = new EventEmitter<string>();
  
  brands: BrandDocument[] = [];
  showForm = false;
  newBrandName = '';
  loading = false;
  hasMoreBrands = true;
  currentPage = 0;
  pageSize = 20;

  private subscription: Subscription;
  selectedBrandId: string | null = null;

  constructor(
    private navigationService: NavigationService,
    private brandService: BrandService,
    private errorHandler: ErrorHandlerService
  ) {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      brandId => this.selectedBrandId = brandId
    );
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.newBrandName = '';
    }
  }

  async submitBrand() {
    if (!this.newBrandName.trim()) return;

    try {
      const brandCreate = { brandInfo: { name: this.newBrandName.trim() } };
      const response = await this.brandService.createBrand(brandCreate as any).toPromise();
      
      // Reset form
      this.newBrandName = '';
      this.showForm = false;

      // Reload brands and select the new one
      await this.loadBrands();
      if (response) {
        this.selectBrand(response);
      }
    } catch (error) {
      this.errorHandler.handleError(error as any);
    }
  }

  async loadBrands(loadMore = false) {
    try {
      this.loading = true;
      if (!loadMore) {
        this.currentPage = 0;
        this.brands = [];
      }

      const params: PaginationParams = {
        offset: this.currentPage * this.pageSize,
        limit: this.pageSize,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const newBrands = await this.brandService.getBrands(params).toPromise();
      if (newBrands) {
        this.brands = loadMore ? [...this.brands, ...newBrands] : newBrands;
        this.hasMoreBrands = newBrands.length === this.pageSize;
      }
    } catch (error) {
      this.errorHandler.handleError(error as any);
    } finally {
      this.loading = false;
    }
  }

  async loadMoreBrands() {
    if (!this.hasMoreBrands || this.loading) return;
    this.currentPage++;
    await this.loadBrands(true);
  }

  selectBrand(brand: BrandDocument, route?: BrandRoute) {
    this.selectedBrandId = brand.id;
    this.brandSelected.emit(brand.brandInfo?.name || brand.id);
    // Use the current route from NavigationService if not explicitly provided
    let navRoute: BrandRoute = route as BrandRoute;
    if (!navRoute) {
      const current = (this.navigationService as any).currentRoute?.getValue?.();
      navRoute = (current === 'generate' || current === 'upload' || current === 'brand_details') ? current : 'brand_details';
    }
    this.navigationService.navigateToBrand(brand.id, navRoute);
  }
}
