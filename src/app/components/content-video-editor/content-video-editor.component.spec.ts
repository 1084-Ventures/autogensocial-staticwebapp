import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentVideoEditorComponent } from './content-video-editor.component';

describe('ContentVideoEditorComponent', () => {
  let component: ContentVideoEditorComponent;
  let fixture: ComponentFixture<ContentVideoEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentVideoEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentVideoEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
