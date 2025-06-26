import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrandService } from '../../services/brand.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import type { components } from '../../generated/models';
import { Subscription } from 'rxjs';

// Use correct generated types
export type BrandDocument = components["schemas"]["BrandDocument"];
export type BrandUpdate = components["schemas"]["BrandUpdate"];
export type SocialAccountEntry = components["schemas"]["SocialAccountEntry"];
export type Platform = components["schemas"]["Platform"];

// Helper: runtime array of supported platforms (from Platform enum type)
const SUPPORTED_PLATFORMS: Platform[] = ["instagram"];

@Component({
  selector: 'app-brand-page',
  standalone: true,
  imports: [
    CommonModule, 
    MaterialModule, 
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatCheckboxModule
  ],
  templateUrl: './brand-page.component.html',
  styleUrl: './brand-page.component.scss'
})
export class BrandPageComponent implements OnInit, OnDestroy {
  brandId: string | null = null;
  brandForm: FormGroup;
  loading = false;
  private subscription: Subscription;

  // Define supported platforms for the form (runtime array)
  readonly supportedPlatforms = SUPPORTED_PLATFORMS;

  constructor(
    private navigationService: NavigationService,
    private brandService: BrandService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.brandForm = this.fb.group({
      brandInfo: this.fb.group({
        name: ['', [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(100)
        ]],
        description: ['', [Validators.maxLength(500)]]
      }),
      socialAccounts: this.fb.group({
        instagram: this.fb.group({
          enabled: [false],
          username: [''],
          accessToken: ['']
        }),
        facebook: this.fb.group({
          enabled: [false],
          username: [''],
          accessToken: ['']
        }),
        tiktok: this.fb.group({
          enabled: [false],
          username: [''],
          accessToken: ['']
        })
      })
    });

    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => {
        this.brandId = id;
        if (id) {
          this.loadBrandData(id);
        }
      }
    );
  }

  ngOnInit() {
    if (this.brandId) {
      this.loadBrandData(this.brandId);
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  async loadBrandData(brandId: string) {
    try {
      this.loading = true;
      const brand = await this.brandService.getBrand(brandId).toPromise();
      if (!brand) return;

      this.brandForm.patchValue({
        brandInfo: {
          name: brand.brandInfo?.name || '',
          description: brand.brandInfo?.description || ''
        },
        // Flatten socialAccounts array to object for form
        socialAccounts: {
          instagram: this.getAccountByPlatform(brand.socialAccounts, 'instagram'),
          facebook: this.getAccountByPlatform(brand.socialAccounts, 'facebook'),
          tiktok: this.getAccountByPlatform(brand.socialAccounts, 'tiktok')
        }
      });
      this.brandForm.markAsPristine();
    } catch (error) {
      this.errorHandler.handleError(error as any);
    } finally {
      this.loading = false;
    }
  }

  getAccountByPlatform(accounts: BrandDocument["socialAccounts"] | undefined, platform: string) {
    const entry = accounts?.find(a => a.platform === platform);
    return {
      enabled: !!entry,
      username: entry?.account?.username || '',
      accessToken: entry?.account?.accessToken || ''
    };
  }

  async onSubmit() {
    if (!this.brandForm.valid || !this.brandId) return;

    try {
      this.loading = true;
      const formValue = this.brandForm.value;
      // Use Platform enum for platform values
      const socialAccounts: SocialAccountEntry[] = this.supportedPlatforms
        .filter(platform => formValue.socialAccounts[platform]?.enabled)
        .map(platform => ({
          platform,
          account: {
            id: '', // id is required, but not present in form; backend should handle
            username: formValue.socialAccounts[platform].username,
            accessToken: formValue.socialAccounts[platform].accessToken,
            profileUrl: '',
            expiryDate: ''
          }
        }));
      const updateData: BrandUpdate = {
        brandInfo: {
          name: formValue.brandInfo.name,
          description: formValue.brandInfo.description
        },
        socialAccounts
      };

      const result = await this.brandService.updateBrand(this.brandId, updateData).toPromise();
      if (result) {
        this.snackBar.open('Brand updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        await this.loadBrandData(this.brandId);
      }
    } catch (error) {
      this.errorHandler.handleError(error as any);
    } finally {
      this.loading = false;
    }
  }

  cancelChanges() {
    if (this.brandId) {
      this.loadBrandData(this.brandId);
    }
  }

  async deleteBrand() {
    if (!this.brandId) return;
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) return;
    try {
      this.loading = true;
      await this.brandService.deleteBrand(this.brandId).toPromise();
      this.snackBar.open('Brand deleted successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.navigationService.navigateToBrand('', 'brand_details');
    } catch (error) {
      this.errorHandler.handleError(error as any);
    } finally {
      this.loading = false;
    }
  }

  // Form control getters
  get brandNameControl(): FormControl {
    return this.brandForm.get('brandInfo.name') as FormControl;
  }

  get instagramEnabled(): FormControl {
    return this.brandForm.get('socialAccounts.instagram.enabled') as FormControl;
  }

  get facebookEnabled(): FormControl {
    return this.brandForm.get('socialAccounts.facebook.enabled') as FormControl;
  }

  get tiktokEnabled(): FormControl {
    return this.brandForm.get('socialAccounts.tiktok.enabled') as FormControl;
  }
}
