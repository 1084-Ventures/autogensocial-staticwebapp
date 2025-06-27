import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { MainlayoutComponent } from './mainlayout.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { SidenavComponent } from '../../components/sidenav/sidenav.component';
import { NavigationService } from '../../services/navigation.service';
import { BrandService } from '../../services/brand.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { MaterialModule } from '../../material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('MainlayoutComponent', () => {
  let component: MainlayoutComponent;
  let fixture: ComponentFixture<MainlayoutComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let brandService: jasmine.SpyObj<BrandService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  const currentBrand$ = new BehaviorSubject<string | null>(null);
  const currentRoute$ = new BehaviorSubject<'brand-details' | 'upload' | 'content-template' | 'settings' | null>('brand-details');

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj('NavigationService', 
      ['navigateToBrand', 'navigateToSettings', 'signOut'],
      { 
        currentBrand$,
        currentRoute$
      }
    );

    brandService = jasmine.createSpyObj('BrandService', ['getBrands', 'createBrand']);
    brandService.getBrands.and.returnValue(of([]));
    errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

    await TestBed.configureTestingModule({
      imports: [
        MainlayoutComponent,
        MaterialModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        ToolbarComponent,
        SidenavComponent
      ],
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: BrandService, useValue: brandService },
        { provide: ErrorHandlerService, useValue: errorHandler }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainlayoutComponent);
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

  it('should include sidenav component', () => {
    const sidenav = fixture.debugElement.query(By.directive(SidenavComponent));
    expect(sidenav).toBeTruthy();
  });

  it('should include router outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });
});
