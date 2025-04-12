import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { UploadPageComponent } from './upload-page.component';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('UploadPageComponent', () => {
  let component: UploadPageComponent;
  let fixture: ComponentFixture<UploadPageComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', [], {
      currentBrand$
    });

    await TestBed.configureTestingModule({
      imports: [
        UploadPageComponent,
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track brand ID changes', () => {
    expect(component.brandId).toBeNull();
    
    const testBrandId = 'test-brand-123';
    currentBrand$.next(testBrandId);
    expect(component.brandId).toBe(testBrandId);

    currentBrand$.next(null);
    expect(component.brandId).toBeNull();
  });

  it('should clean up subscription on destroy', () => {
    const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subscriptionSpy).toHaveBeenCalled();
  });
});
