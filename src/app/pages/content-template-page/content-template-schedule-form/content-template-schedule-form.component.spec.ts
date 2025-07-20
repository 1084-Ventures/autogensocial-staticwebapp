import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateScheduleFormComponent } from './content-template-schedule-form.component';

describe('ContentTemplateScheduleFormComponent', () => {
  let component: ContentTemplateScheduleFormComponent;
  let fixture: ComponentFixture<ContentTemplateScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateScheduleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
