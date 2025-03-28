import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-brand-page',
  imports: [],
  templateUrl: './brand-page.component.html',
  styleUrl: './brand-page.component.scss'
})
export class BrandPageComponent implements OnDestroy {
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
