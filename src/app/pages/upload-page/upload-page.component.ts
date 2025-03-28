import { Component, OnDestroy } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-upload-page',
  imports: [],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.scss'
})
export class UploadPageComponent implements OnDestroy {
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
