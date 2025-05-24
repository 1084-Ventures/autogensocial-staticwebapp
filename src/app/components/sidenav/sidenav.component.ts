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
import { BrandNameResponse } from '../../../../api/src/models/brand.model';
import { PaginationParams } from '../../../../api/src/models/base.model';

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
  
  brands: BrandNameResponse[] = [];
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
      const brandCreate = { name: this.newBrandName.trim() };
      const response = await this.brandService.createBrand(brandCreate).toPromise();
      
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

  selectBrand(brand: BrandNameResponse, route: BrandRoute = 'brand_details') {
    this.selectedBrandId = brand.id;
    this.brandSelected.emit(brand.name);
    this.navigationService.navigateToBrand(brand.id, route);
  }
}
