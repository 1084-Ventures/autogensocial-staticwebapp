import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentMultiImageEditorComponent } from './content-multi-image-editor.component';

describe('ContentMultiImageEditorComponent', () => {
  let component: ContentMultiImageEditorComponent;
  let fixture: ComponentFixture<ContentMultiImageEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentMultiImageEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentMultiImageEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
