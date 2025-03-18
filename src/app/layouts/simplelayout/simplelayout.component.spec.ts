import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplelayoutComponent } from './simplelayout.component';

describe('SimplelayoutComponent', () => {
  let component: SimplelayoutComponent;
  let fixture: ComponentFixture<SimplelayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimplelayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimplelayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
