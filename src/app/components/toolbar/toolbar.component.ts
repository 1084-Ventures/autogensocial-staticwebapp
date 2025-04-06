import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { NavigationService, BrandRoute } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

export type NavItem = 'brand_details' | 'upload' | 'generate' | 'settings' | null;

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [MaterialModule, RouterModule]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() appName = 'AutoGen Social';
  @Output() toggleMenu = new EventEmitter<void>();
  @Output() navSelected = new EventEmitter<NavItem>();

  currentRoute: NavItem = 'brand_details';
  currentBrandId: string | null = null;
  private routeSubscription: Subscription;
  private brandSubscription: Subscription;

  constructor(private navigationService: NavigationService) {
    this.routeSubscription = this.navigationService.currentRoute$.subscribe(
      route => this.currentRoute = route
    );
    this.brandSubscription = this.navigationService.currentBrand$.subscribe(
      brandId => this.currentBrandId = brandId
    );
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
    this.brandSubscription.unsubscribe();
  }

  isSelected(route: NavItem): boolean {
    return this.currentRoute === route;
  }

  onNavSelect(route: BrandRoute) {
    // Always navigate with current brandId (which may be null)
    this.navigationService.navigateToBrand(this.currentBrandId, route);
  }

  onSettingsClick() {
    this.navigationService.navigateToSettings();
  }

  onSignOut() {
    this.navigationService.signOut();
  }
}