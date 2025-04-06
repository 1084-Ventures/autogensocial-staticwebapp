import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, AbstractControl, FormControl } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Brand, BrandUpdate, BrandDocument } from '../../../../api/src/models/brand.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
  private subscription: any;

  constructor(
    private navigationService: NavigationService,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.brandForm = this.fb.group({
      brandInfo: this.fb.group({
        name: ['', [Validators.required]],
        description: ['']
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

  async loadBrandData(brandId: string) {
    try {
      this.loading = true;
      const response = await firstValueFrom(
        this.http.get<BrandDocument>(`/api/brand_management/${brandId}`)
      );
      
      // Update form with all brand data
      this.brandForm.patchValue({
        brandInfo: {
          name: response.brandInfo.name,
          description: response.brandInfo.description || ''
        },
        socialAccounts: {
          instagram: {
            enabled: response.socialAccounts.instagram.enabled,
            username: response.socialAccounts.instagram.username,
            accessToken: response.socialAccounts.instagram.accessToken
          },
          facebook: {
            enabled: response.socialAccounts.facebook.enabled,
            username: response.socialAccounts.facebook.username,
            accessToken: response.socialAccounts.facebook.accessToken
          },
          tiktok: {
            enabled: response.socialAccounts.tiktok.enabled,
            username: response.socialAccounts.tiktok.username,
            accessToken: response.socialAccounts.tiktok.accessToken
          }
        }
      });
      this.brandForm.markAsPristine();
    } catch (error) {
      console.error('Error loading brand:', error);
      // TODO: Add error handling/notification
    } finally {
      this.loading = false;
    }
  }

  cancelChanges() {
    if (this.brandId) {
      this.loadBrandData(this.brandId);
    }
  }

  async onSubmit() {
    if (this.brandForm.valid && this.brandId) {
      try {
        this.loading = true;
        const formValue = this.brandForm.value;
        
        const updateData: BrandUpdate = {
          name: formValue.brandInfo.name,
          description: formValue.brandInfo.description,
          socialAccounts: {
            instagram: formValue.socialAccounts.instagram,
            facebook: formValue.socialAccounts.facebook,
            tiktok: formValue.socialAccounts.tiktok
          }
        };

        const response = await firstValueFrom(
          this.http.put<BrandDocument>(`/api/brand_management/${this.brandId}`, updateData)
        );

        // Show success message
        this.snackBar.open('Brand updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });

        // Update form with response data to ensure sync
        this.loadBrandData(this.brandId);
      } catch (error) {
        console.error('Error updating brand:', error);
        this.snackBar.open('Error updating brand', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      } finally {
        this.loading = false;
      }
    }
  }

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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
