import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NavigationService, BrandRoute } from '../services/navigation.service';

@Injectable({
  providedIn: 'root'
})
export class BrandGuard implements CanActivate {
  constructor(private navigationService: NavigationService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const brandId = route.paramMap.get('id');
    if (!brandId) {
      const currentRoute = route.data['type'] as BrandRoute;
      this.navigationService.navigateToBrandSelection(currentRoute);
      return false;
    }
    return true;
  }
}
