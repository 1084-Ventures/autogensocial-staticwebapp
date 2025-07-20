import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateInfoFormComponent } from './content-template-info-form.component';

describe('ContentTemplateInfoFormComponent', () => {
  let component: ContentTemplateInfoFormComponent;
  let fixture: ComponentFixture<ContentTemplateInfoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateInfoFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
