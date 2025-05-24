import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BrandPageComponent } from './brand-page.component';
import { NavigationService } from '../../services/navigation.service';
import { BrandService } from '../../services/brand.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrandDocument, validateBrandName, validateBrandDescription } from '../../../../api/src/models/brand.model';
import { HttpErrorResponse } from '@angular/common/http';

describe('BrandPageComponent', () => {
  let component: BrandPageComponent;
  let fixture: ComponentFixture<BrandPageComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let brandService: jasmine.SpyObj<BrandService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  const mockBrand: BrandDocument = {
    id: '1',
    metadata: {
      createdAt: '2025-04-11T00:00:00Z',
      updatedAt: '2025-04-11T00:00:00Z',
      isActive: true,
      version: 1
    },
    brandInfo: {
      name: 'Test Brand',
      description: 'Test Description',
      userId: 'test-user-id'
    },
    socialAccounts: {
      instagram: {
        enabled: true,
        username: 'testinsta',
        accessToken: 'insta-token'
      },
      facebook: {
        enabled: false,
        username: '',
        accessToken: ''
      },
      tiktok: {
        enabled: false,
        username: '',
        accessToken: ''
      }
    }
  };

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', [], { currentBrand$ });
    brandService = jasmine.createSpyObj('BrandService', ['getBrand', 'updateBrand']);
    errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    brandService.getBrand.and.returnValue(of(mockBrand));
    brandService.updateBrand.and.returnValue(of(mockBrand));

    await TestBed.configureTestingModule({
      imports: [
        BrandPageComponent,
        MaterialModule,
        BrowserAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: BrandService, useValue: brandService },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization and Data Loading', () => {
    it('should initialize form with empty values', () => {
      // Create new component instance to test initial state
      fixture = TestBed.createComponent(BrandPageComponent);
      component = fixture.componentInstance;
      
      // Form should be initialized in constructor, detect changes to trigger lifecycle hooks
      fixture.detectChanges();

      expect(component.brandForm.value).toEqual({
        brandInfo: {
          name: '',
          description: ''
        },
        socialAccounts: {
          instagram: { enabled: false, username: '', accessToken: '' },
          facebook: { enabled: false, username: '', accessToken: '' },
          tiktok: { enabled: false, username: '', accessToken: '' }
        }
      });
    });

    it('should load brand data when brand ID is set', fakeAsync(() => {
      currentBrand$.next('1');
      tick();

      expect(brandService.getBrand).toHaveBeenCalledWith('1');
      expect(component.brandForm.value).toEqual({
        brandInfo: {
          name: mockBrand.brandInfo.name,
          description: mockBrand.brandInfo.description
        },
        socialAccounts: mockBrand.socialAccounts
      });
      expect(component.brandForm.pristine).toBeTrue();
    }));

    it('should handle brand loading error', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      brandService.getBrand.and.returnValue(throwError(() => error));

      currentBrand$.next('1');
      tick();

      expect(errorHandler.handleError).toHaveBeenCalledWith(error);
      expect(component.loading).toBeFalse();
    }));
  });

  describe('Form Validation and Submission', () => {
    // Remove the beforeEach block that was adding duplicate spies
    
    it('should validate required brand name', () => {
      const nameControl = component.brandNameControl;
      nameControl.setValue('');
      expect(nameControl.errors?.['required']).toBeTruthy();
      
      nameControl.setValue('Test');
      expect(nameControl.errors).toBeNull();
    });

    it('should validate brand name length', () => {
      const nameControl = component.brandNameControl;
      nameControl.setValue('a'.repeat(101));
      expect(nameControl.errors?.['maxlength']).toBeTruthy();
    });

    it('should not submit if form is invalid', fakeAsync(() => {
      component.brandForm.get('brandInfo.name')?.setValue('');
      component.onSubmit();
      tick();

      expect(brandService.updateBrand).not.toHaveBeenCalled();
    }));

    it('should submit valid form data', fakeAsync(async () => {
      currentBrand$.next('1');
      tick();

      const updateData = {
        name: 'Valid Brand Name',
        description: 'Valid Description',
        socialAccounts: {
          instagram: { enabled: true, username: 'newinsta', accessToken: 'new-token' },
          facebook: { enabled: false, username: '', accessToken: '' },
          tiktok: { enabled: false, username: '', accessToken: '' }
        }
      };

      const updatedBrand = {
        ...mockBrand,
        brandInfo: {
          ...mockBrand.brandInfo,
          name: updateData.name,
          description: updateData.description
        },
        socialAccounts: updateData.socialAccounts
      };

      // Mock the update response
      brandService.updateBrand.and.returnValue(of(updatedBrand));

      // Set valid form data
      component.brandForm.patchValue({
        brandInfo: {
          name: updateData.name,
          description: updateData.description
        },
        socialAccounts: updateData.socialAccounts
      });

      // Ensure form is valid
      component.brandForm.markAsTouched();
      component.brandForm.updateValueAndValidity();
      expect(component.brandForm.valid).toBeTrue();

      // Submit form and wait for it to complete
      await component.onSubmit();
      tick();

      // Verify expectations
      expect(brandService.updateBrand).toHaveBeenCalledWith('1', updateData);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Brand updated successfully',
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        })
      );
    }));

    it('should handle update errors', fakeAsync(() => {
      currentBrand$.next('1');
      tick();

      const error = new HttpErrorResponse({
        error: 'Update failed',
        status: 500,
        statusText: 'Internal Server Error'
      });
      brandService.updateBrand.and.returnValue(throwError(() => error));

      component.brandForm.patchValue({
        brandInfo: {
          name: 'Test Update',
          description: 'Test'
        }
      });

      component.onSubmit();
      tick();

      expect(component.loading).toBeFalse();
      expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    }));
  });

  describe('Social Account Management', () => {
    const socialPlatforms = ['instagram', 'facebook', 'tiktok'] as const;
    type SocialPlatform = typeof socialPlatforms[number];

    it('should toggle social account fields', () => {
      const instagramControl = component.instagramEnabled;
      expect(instagramControl).toBeTruthy();
      
      instagramControl.setValue(true);
      expect(component.brandForm.get('socialAccounts.instagram')?.enabled).toBeTrue();

      instagramControl.setValue(false);
      expect(component.brandForm.get('socialAccounts.instagram')?.disabled).toBeFalse();
    });

    it('should handle all social platform toggles', () => {
      socialPlatforms.forEach(platform => {
        const controlName = `${platform}Enabled` as keyof BrandPageComponent;
        const control = component[controlName];
        if (control && typeof control === 'object' && 'setValue' in control) {
          control.setValue(true);
          expect(component.brandForm.get(`socialAccounts.${platform}`)?.enabled).toBeTrue();
        }
      });
    });
  });

  describe('Form Reset and Cancel', () => {
    it('should reset form to last loaded data', fakeAsync(() => {
      currentBrand$.next('1');
      tick();

      component.brandForm.patchValue({
        brandInfo: {
          name: 'Changed Name',
          description: 'Changed Description'
        }
      });

      component.cancelChanges();
      tick();

      expect(component.brandForm.value.brandInfo.name).toBe(mockBrand.brandInfo.name);
      expect(component.brandForm.value.brandInfo.description).toBe(mockBrand.brandInfo.description);
    }));
  });

  it('should clean up subscription on destroy', () => {
    const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subscriptionSpy).toHaveBeenCalled();
  });
});
