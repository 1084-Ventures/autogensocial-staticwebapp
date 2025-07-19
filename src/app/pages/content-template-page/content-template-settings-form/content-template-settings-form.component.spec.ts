import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateSettingsFormComponent } from './content-template-settings-form.component';

describe('ContentTemplateSettingsFormComponent', () => {
  let component: ContentTemplateSettingsFormComponent;
  let fixture: ComponentFixture<ContentTemplateSettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateSettingsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateSettingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
