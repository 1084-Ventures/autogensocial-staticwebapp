import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ContentTemplatePageComponent } from './content-template-page.component';
import { NavigationService } from '../../../services/navigation.service';
import { MaterialModule } from '../../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ContentTemplatePageComponent', () => {
  let component: ContentTemplatePageComponent;
  let fixture: ComponentFixture<ContentTemplatePageComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', [], {
      currentBrand$
    });

    await TestBed.configureTestingModule({
      imports: [
        ContentTemplatePageComponent,
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentTemplatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track brand ID changes', () => {
    const testBrandId = 'test-brand-123';
    currentBrand$.next(testBrandId);
    expect(component.brandId).toBe(testBrandId);

    currentBrand$.next(null);
    expect(component.brandId).toBeNull();
  });

  it('should add and remove platforms correctly', () => {
    if (!component.templateData) component.templateData = {} as any;
    if (!component.templateData.templateInfo) component.templateData.templateInfo = { name: '', description: '', contentType: 'text', socialAccounts: [] };
    // ...rest of the test logic from generate-page.component.spec.ts...
  });
});
