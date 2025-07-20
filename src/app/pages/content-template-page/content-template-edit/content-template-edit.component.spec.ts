import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTemplateEditComponent } from './content-template-edit.component';

describe('ContentTemplateEditComponent', () => {
  let component: ContentTemplateEditComponent;
  let fixture: ComponentFixture<ContentTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTemplateEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
