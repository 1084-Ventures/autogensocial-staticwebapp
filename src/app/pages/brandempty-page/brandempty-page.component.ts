import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-brandempty-page',
  imports: [],
  templateUrl: './brandempty-page.component.html',
  styleUrl: './brandempty-page.component.scss'
})
export class BrandemptyPageComponent implements OnDestroy {
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
