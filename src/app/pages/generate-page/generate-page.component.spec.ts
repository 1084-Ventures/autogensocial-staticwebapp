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
    if (!component.templateData) component.templateData = {} as any;
    if (!component.templateData.templateInfo) component.templateData.templateInfo = { name: '', description: '', contentType: 'text', socialAccounts: [] };
    if (!component.templateData.templateInfo.socialAccounts) {
      component.templateData.templateInfo.socialAccounts = [];
    }
    component.templateData.templateInfo.socialAccounts = [];
    component.togglePlatform('instagram', true);
    expect(component.templateData.templateInfo.socialAccounts).toContain('instagram');
    component.togglePlatform('facebook', true);
    expect(component.templateData.templateInfo.socialAccounts).toContain('facebook');
    component.togglePlatform('instagram', false);
    expect(component.templateData.templateInfo.socialAccounts).not.toContain('instagram');
  });

  it('should add and remove themes correctly', () => {
    if (!component.templateData) component.templateData = {} as any;
    if (!component.templateData.settings) component.templateData.settings = { promptTemplate: { userPrompt: '', variables: [] }, visualStyle: { themes: [] }, contentItem: { type: 'text', text: { type: 'text', value: '' } } };
    if (!component.templateData.settings.visualStyle) {
      component.templateData.settings.visualStyle = { themes: [] };
    }
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
