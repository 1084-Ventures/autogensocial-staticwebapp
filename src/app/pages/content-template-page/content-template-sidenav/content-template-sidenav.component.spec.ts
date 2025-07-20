import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateSidenavComponent } from './content-template-sidenav.component';

describe('ContentTemplateSidenavComponent', () => {
  let component: ContentTemplateSidenavComponent;
  let fixture: ComponentFixture<ContentTemplateSidenavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateSidenavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateSidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
