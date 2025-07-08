import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BrandGuard } from './brand.guard';
import { NavigationService } from '../services/navigation.service';

describe('BrandGuard', () => {
  let guard: BrandGuard;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['navigateToBrandSelection']);
    TestBed.configureTestingModule({
      providers: [
        BrandGuard,
        { provide: NavigationService, useValue: navigationServiceSpy }
      ]
    });
    guard = TestBed.inject(BrandGuard);
    route = new ActivatedRouteSnapshot();
    state = {} as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if brandId is present', () => {
    spyOn(route.paramMap, 'get').and.returnValue('123');
    const result = guard.canActivate(route, state);
    expect(result).toBeTrue();
    expect(navigationServiceSpy.navigateToBrandSelection).not.toHaveBeenCalled();
  });

  it('should return false and navigate if brandId is missing', () => {
    spyOn(route.paramMap, 'get').and.returnValue(null);
    route.data = { type: 'testType' };
    const result = guard.canActivate(route, state);
    expect(result).toBeFalse();
    expect(navigationServiceSpy.navigateToBrandSelection).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'testType' }));
  });
});
