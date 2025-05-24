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
import { BrandDocument, BrandUpdate, validateBrandName, validateBrandDescription } from '../../../../api/src/models/brand.model';
import { Subscription } from 'rxjs';

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
          name: brand.brandInfo.name,
          description: brand.brandInfo.description || ''
        },
        socialAccounts: {
          instagram: {
            enabled: brand.socialAccounts.instagram.enabled,
            username: brand.socialAccounts.instagram.username,
            accessToken: brand.socialAccounts.instagram.accessToken
          },
          facebook: {
            enabled: brand.socialAccounts.facebook.enabled,
            username: brand.socialAccounts.facebook.username,
            accessToken: brand.socialAccounts.facebook.accessToken
          },
          tiktok: {
            enabled: brand.socialAccounts.tiktok.enabled,
            username: brand.socialAccounts.tiktok.username,
            accessToken: brand.socialAccounts.tiktok.accessToken
          }
        }
      });
      this.brandForm.markAsPristine();
    } catch (error) {
      this.errorHandler.handleError(error as any);
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (!this.brandForm.valid || !this.brandId) return;

    try {
      this.loading = true;
      const formValue = this.brandForm.value;

      // Client-side validation
      if (!validateBrandName(formValue.brandInfo.name)) {
        this.snackBar.open('Brand name must be between 1 and 100 characters', 'Close', {
          duration: 3000
        });
        return;
      }

      if (formValue.brandInfo.description && !validateBrandDescription(formValue.brandInfo.description)) {
        this.snackBar.open('Description must not exceed 500 characters', 'Close', {
          duration: 3000
        });
        return;
      }

      const updateData: BrandUpdate = {
        name: formValue.brandInfo.name,
        description: formValue.brandInfo.description,
        socialAccounts: {
          instagram: formValue.socialAccounts.instagram,
          facebook: formValue.socialAccounts.facebook,
          tiktok: formValue.socialAccounts.tiktok
        }
      };

      const result = await this.brandService.updateBrand(this.brandId, updateData).toPromise();
      
      // Only show success message if update was successful
      if (result) {
        this.snackBar.open('Brand updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        
        // Refresh form with latest data
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
