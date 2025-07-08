import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ToolbarComponent, NavItem } from './toolbar.component';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  const currentRoute$ = new BehaviorSubject<NavItem>('brand-details');
  const currentBrand$ = new BehaviorSubject<string | null>(null);

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', [
      'navigateToBrand',
      'navigateToSettings',
      'signOut'
    ], {
      currentRoute$,
      currentBrand$
    });

    await TestBed.configureTestingModule({
      imports: [ToolbarComponent, MaterialModule, RouterModule],
      providers: [
        { provide: NavigationService, useValue: navigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default app name', () => {
    expect(component.appName).toBe('AutoGen Social');
  });

  it('should allow custom app name via input', () => {
    component.appName = 'Custom App';
    fixture.detectChanges();
    expect(component.appName).toBe('Custom App');
  });

  it('should emit toggleMenu event', () => {
    spyOn(component.toggleMenu, 'emit');
    component.toggleMenu.emit();
    expect(component.toggleMenu.emit).toHaveBeenCalled();
  });

  it('should update currentRoute when navigation service emits new route', () => {
    currentRoute$.next('content-template');
    expect(component.currentRoute).toBe('content-template');
  });

  it('should update currentBrandId when navigation service emits new brand', () => {
    const testBrandId = 'test-brand-123';
    currentBrand$.next(testBrandId);
    expect(component.currentBrandId).toBe(testBrandId);
  });

  it('should correctly check if route is selected', () => {
    component.currentRoute = 'content-template';
    expect(component.isSelected('content-template')).toBeTrue();
    expect(component.isSelected('settings')).toBeFalse();
  });

  it('should navigate to brand route with current brand ID', () => {
    const testBrandId = 'test-brand-123';
    currentBrand$.next(testBrandId);
    component.onNavSelect('content-template');
    expect(navigationService.navigateToBrand).toHaveBeenCalledWith(testBrandId, 'content-template');
  });

  it('should navigate to settings', () => {
    component.onSettingsClick();
    expect(navigationService.navigateToSettings).toHaveBeenCalled();
  });

  it('should call sign out', () => {
    component.onSignOut();
    expect(navigationService.signOut).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    const routeSub = spyOn(component['routeSubscription'], 'unsubscribe');
    const brandSub = spyOn(component['brandSubscription'], 'unsubscribe');
    
    component.ngOnDestroy();
    
    expect(routeSub).toHaveBeenCalled();
    expect(brandSub).toHaveBeenCalled();
  });
});
