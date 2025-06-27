import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { SidenavComponent } from './sidenav.component';
import { NavigationService } from '../../services/navigation.service';
import { BrandService } from '../../services/brand.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import type { components } from '../../generated/models';

type BrandDocument = components['schemas']['BrandDocument'];

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let brandService: jasmine.SpyObj<BrandService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  const mockBrands: BrandDocument[] = [
    { id: '1', metadata: { createdDate: '', updated_date: '', is_active: true }, brandInfo: { name: 'Brand 1' } },
    { id: '2', metadata: { createdDate: '', updated_date: '', is_active: true }, brandInfo: { name: 'Brand 2' } }
  ];

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', 
      ['navigateToBrand', 'navigateToSettings', 'signOut'],
      { currentBrand$ }
    );

    brandService = jasmine.createSpyObj('BrandService', ['getBrands', 'createBrand']);
    brandService.getBrands.and.returnValue(of(mockBrands));
    brandService.createBrand.and.returnValue(of(mockBrands[0]));

    errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

    await TestBed.configureTestingModule({
      imports: [
        SidenavComponent,
        MaterialModule,
        BrowserAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: BrandService, useValue: brandService },
        { provide: ErrorHandlerService, useValue: errorHandler }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Brand Loading', () => {
    it('should load brands on init', () => {
      expect(brandService.getBrands).toHaveBeenCalledWith({
        offset: 0,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      expect(component.brands).toEqual(mockBrands);
    });

    it('should handle pagination correctly', fakeAsync(async () => {
      const moreBrands: BrandDocument[] = [
        { id: '3', metadata: { createdDate: '', updated_date: '', is_active: true }, brandInfo: { name: 'Brand 3' } },
        { id: '4', metadata: { createdDate: '', updated_date: '', is_active: true }, brandInfo: { name: 'Brand 4' } }
      ];

      // Clear previous calls and set up the test state
      brandService.getBrands.calls.reset();
      component.brands = [...mockBrands];
      component.currentPage = 0; // Reset to 0 before loading more
      component.hasMoreBrands = true;
      component.pageSize = 2; // Set pageSize to match our test data size
      brandService.getBrands.and.returnValue(of(moreBrands));

      // Trigger load more which will increment currentPage
      await component.loadMoreBrands();
      tick();

      // Verify the service was called with correct pagination params
      expect(brandService.getBrands).toHaveBeenCalledWith({
        offset: 2, // offset should be currentPage(1) * pageSize(2)
        limit: 2,  // limit should match pageSize
        sortBy: 'name',
        sortOrder: 'asc'
      });

      // Verify the brands array was updated correctly
      expect(component.brands.length).toBe(4);
      expect(component.brands).toEqual([...mockBrands, ...moreBrands]);
      
      // Since we got a full page of results (2 brands when pageSize is 2)
      // hasMoreBrands should be true
      expect(component.hasMoreBrands).toBeTrue();
    }));

    it('should handle empty brand results', fakeAsync(() => {
      brandService.getBrands.and.returnValue(of([]));
      
      component.loadMoreBrands();
      tick();

      expect(component.hasMoreBrands).toBeFalse();
    }));

    it('should handle loading errors', fakeAsync(() => {
      const error = new Error('Network error');
      brandService.getBrands.and.returnValue(throwError(() => error));

      component.loadBrands();
      tick();

      expect(component.loading).toBeFalse();
      expect(component.brands).toEqual([]);
    }));
  });

  describe('Brand Creation', () => {
    it('should toggle brand creation form', () => {
      component.toggleForm();
      expect(component.showForm).toBeTrue();

      component.toggleForm();
      expect(component.showForm).toBeFalse();
      expect(component.newBrandName).toBe('');
    });

    it('should create new brand successfully', fakeAsync(() => {
      const newBrand: BrandDocument = { id: '5', metadata: { createdDate: '', updated_date: '', is_active: true }, brandInfo: { name: 'New Brand' } };
      brandService.createBrand.and.returnValue(of(newBrand));
      
      component.newBrandName = 'New Brand';
      component.submitBrand();
      tick();

      expect(brandService.createBrand).toHaveBeenCalledWith({ brandInfo: { name: 'New Brand' } });
      expect(component.showForm).toBeFalse();
      expect(component.newBrandName).toBe('');
      expect(navigationService.navigateToBrand).toHaveBeenCalledWith(newBrand.id, 'brand-details');
    }));

    it('should not submit empty brand name', fakeAsync(() => {
      component.newBrandName = '   ';
      component.submitBrand();
      tick();

      expect(brandService.createBrand).not.toHaveBeenCalled();
    }));

    it('should handle brand creation errors', fakeAsync(() => {
      const error = new Error('Creation failed');
      brandService.createBrand.and.returnValue(throwError(() => error));
      
      component.newBrandName = 'New Brand';
      component.showForm = true;
      
      component.submitBrand();
      tick();

      expect(component.showForm).toBeTrue(); // Form should stay open on error
      expect(component.newBrandName).toBe('New Brand'); // Input should retain value
      expect(errorHandler.handleError).toHaveBeenCalled();
    }));
  });

  describe('Brand Selection', () => {
    beforeEach(() => {
      spyOn(component.brandSelected, 'emit');
    });

    it('should update selected brand and navigate', () => {
      const brand = mockBrands[0];
      component.selectBrand(brand);

      expect(component.selectedBrandId).toBe(brand.id);
      expect(component.brandSelected.emit).toHaveBeenCalledWith(brand.brandInfo?.name || brand.id);
      expect(navigationService.navigateToBrand).toHaveBeenCalledWith(brand.id, 'brand-details');
    });

    it('should update selected brand when navigation service emits', () => {
      const brandId = '1';
      currentBrand$.next(brandId);
      expect(component.selectedBrandId).toBe(brandId);
    });
  });

  it('should clean up subscriptions on destroy', () => {
    const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');
    
    component.ngOnDestroy();
    
    expect(subscriptionSpy).toHaveBeenCalled();
  });
});