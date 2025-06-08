import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { GeneratePageComponent } from './generate-page.component';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('GeneratePageComponent', () => {
  let component: GeneratePageComponent;
  let fixture: ComponentFixture<GeneratePageComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', [], {
      currentBrand$
    });

    await TestBed.configureTestingModule({
      imports: [
        GeneratePageComponent,
        MaterialModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneratePageComponent);
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
    component.templateData.templateInfo.targetPlatforms = [];
    component.togglePlatform('instagram', true);
    expect(component.templateData.templateInfo.targetPlatforms).toContain('instagram');
    component.togglePlatform('facebook', true);
    expect(component.templateData.templateInfo.targetPlatforms).toContain('facebook');
    component.togglePlatform('instagram', false);
    expect(component.templateData.templateInfo.targetPlatforms).not.toContain('instagram');
  });

  it('should add and remove themes correctly', () => {
    component.templateData.settings.visualStyle.themes = [];
    component.addTheme();
    expect(component.templateData.settings.visualStyle.themes.length).toBe(1);
    component.addTheme();
    expect(component.templateData.settings.visualStyle.themes.length).toBe(2);
    component.removeTheme(0);
    expect(component.templateData.settings.visualStyle.themes.length).toBe(1);
  });

  it('should clean up subscription on destroy', () => {
    const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subscriptionSpy).toHaveBeenCalled();
  });
});
