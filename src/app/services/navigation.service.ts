import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export type BrandRoute = 'brand_details' | 'generate' | 'upload';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private currentBrandId = new BehaviorSubject<string | null>(null);
  private currentRoute = new BehaviorSubject<BrandRoute | 'settings' | null>(null);
  
  currentBrand$ = this.currentBrandId.asObservable();
  currentRoute$ = this.currentRoute.asObservable();

  constructor(private router: Router) {}

  navigateToBrand(brandId: string | null, route: BrandRoute) {
    this.currentBrandId.next(brandId);
    this.currentRoute.next(route);
    
    if (brandId) {
      return this.router.navigate(['brand', brandId, route]);
    } else {
      return this.router.navigate(['/', route]);
    }
  }

  navigateToSettings() {
    this.currentRoute.next('settings');
    this.currentBrandId.next(null); // Reset the brand ID when navigating to settings
    return this.router.navigate(['/settings']);
  }

  navigateToBrandSelection(returnRoute: BrandRoute) {
    return this.router.navigate(['/brand-selection'], {
      queryParams: { returnTo: returnRoute }
    });
  }

  signOut() {
    // Handle sign out logic
    window.location.href = "https://login.microsoftonline.com/common/oauth2/logout";
  }

  getCurrentPath(): string {
    return this.router.url;
  }
}
