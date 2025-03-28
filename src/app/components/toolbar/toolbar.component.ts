import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { Subscription } from 'rxjs';

export type NavItem = 'brand_details' | 'upload' | 'generate' | 'settings' | null;

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  imports: [MaterialModule]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() appName = 'AutoGen Social';
  @Output() toggleMenu = new EventEmitter<void>();
  @Output() navSelected = new EventEmitter<NavItem>();

  currentRoute: NavItem = null;
  private subscription: Subscription;

  constructor(private navigationService: NavigationService) {
    this.subscription = this.navigationService.currentRoute$.subscribe(
      route => this.currentRoute = route
    );
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isSelected(route: NavItem): boolean {
    return this.currentRoute === route;
  }

  onNavSelect(item: NavItem) {
    this.navSelected.emit(item);
  }

  onSettingsClick() {
    this.navigationService.navigateToSettings();
  }

  onSignOut() {
    this.navigationService.signOut();
  }
}
