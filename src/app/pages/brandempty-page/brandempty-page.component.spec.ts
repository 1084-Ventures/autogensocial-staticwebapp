import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandemptyPageComponent } from './brandempty-page.component';

describe('BrandemptyPageComponent', () => {
  let component: BrandemptyPageComponent;
  let fixture: ComponentFixture<BrandemptyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandemptyPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrandemptyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
