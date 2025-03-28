import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-generate-page',
  imports: [],
  templateUrl: './generate-page.component.html',
  styleUrl: './generate-page.component.scss'
})
export class GeneratePageComponent implements OnDestroy {
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
