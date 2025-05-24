import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { SimplelayoutComponent } from './simplelayout.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { NavigationService } from '../../services/navigation.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SimplelayoutComponent', () => {
  let component: SimplelayoutComponent;
  let fixture: ComponentFixture<SimplelayoutComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);
  const currentRoute$ = new BehaviorSubject<'brand_details' | 'upload' | 'generate' | 'settings' | null>('brand_details');

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', 
      ['navigateToBrand', 'navigateToSettings', 'signOut'],
      { 
        currentBrand$,
        currentRoute$
      }
    );

    await TestBed.configureTestingModule({
      imports: [
        SimplelayoutComponent,
        MaterialModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        ToolbarComponent
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SimplelayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should include toolbar component', () => {
    const toolbar = fixture.debugElement.query(By.directive(ToolbarComponent));
    expect(toolbar).toBeTruthy();
  });

  it('should include router outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });

  it('should not include sidenav component', () => {
    const sidenav = fixture.debugElement.query(By.css('app-sidenav'));
    expect(sidenav).toBeNull();
  });
});
