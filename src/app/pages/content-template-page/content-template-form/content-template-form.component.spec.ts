import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateFormComponent } from './content-template-form.component';

describe('ContentTemplateFormComponent', () => {
  let component: ContentTemplateFormComponent;
  let fixture: ComponentFixture<ContentTemplateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
