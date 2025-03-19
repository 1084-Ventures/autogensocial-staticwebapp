import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandModalComponent } from './brand-modal.component';

describe('BrandModalComponent', () => {
  let component: BrandModalComponent;
  let fixture: ComponentFixture<BrandModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrandModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
