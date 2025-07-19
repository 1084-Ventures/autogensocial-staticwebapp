import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplatePageComponent } from './content-template-page.component';

describe('ContentTemplatePageComponent', () => {
  let component: ContentTemplatePageComponent;
  let fixture: ComponentFixture<ContentTemplatePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplatePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
