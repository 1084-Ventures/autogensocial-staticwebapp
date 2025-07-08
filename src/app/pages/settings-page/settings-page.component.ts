import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-settings-page',
  imports: [],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnDestroy {
  brandId: string | null = null;
  private subscription: any;

  constructor(private navigationService: NavigationService) {
    this.subscription = this.navigationService.currentBrand$.subscribe(
      id => this.brandId = id
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
