import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateContentItemFormComponent } from './content-template-content-item-form.component';

describe('ContentTemplateContentItemFormComponent', () => {
  let component: ContentTemplateContentItemFormComponent;
  let fixture: ComponentFixture<ContentTemplateContentItemFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateContentItemFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateContentItemFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
