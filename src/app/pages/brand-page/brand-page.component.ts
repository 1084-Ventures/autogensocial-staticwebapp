import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Brand, BrandUpdate } from '../../../../api/src/models/brand.model';

@Component({
  selector: 'app-brand-page',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, HttpClientModule],
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
    private http: HttpClient
  ) {
    this.brandForm = this.fb.group({
      brandInfo: this.fb.group({
        name: ['', Validators.required],
        description: ['']
      }),
      socialAccounts: this.fb.group({
        instagram: this.fb.group({
          enabled: [false],
          username: ['']
        }),
        facebook: this.fb.group({
          enabled: [false],
          username: ['']
        }),
        tiktok: this.fb.group({
          enabled: [false],
          username: ['']
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
        this.http.get<Brand>(`/api/api/brand_management/${brandId}`)
      );
      
      // Reset form with new values
      this.brandForm.patchValue({
        brandInfo: {
          name: response.brandInfo.name,
          description: response.brandInfo.description
        },
        socialAccounts: {
          instagram: response.socialAccounts?.instagram ?? {
            enabled: false,
            username: ''
          },
          facebook: response.socialAccounts?.facebook ?? {
            enabled: false,
            username: ''
          },
          tiktok: response.socialAccounts?.tiktok ?? {
            enabled: false,
            username: ''
          }
        }
      });
      this.brandForm.markAsPristine();
    } catch (error) {
      console.error('Error loading brand:', error);
    } finally {
      this.loading = false;
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

        await firstValueFrom(
          this.http.put(`/api/api/brand_management/${this.brandId}`, updateData)
        );
        // Show success message
      } catch (error) {
        console.error('Error updating brand:', error);
        // Show error message
      } finally {
        this.loading = false;
      }
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
