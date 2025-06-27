import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentImageEditorComponent } from './content-image-editor.component';

describe('ContentImageEditorComponent', () => {
  let component: ContentImageEditorComponent;
  let fixture: ComponentFixture<ContentImageEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentImageEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentImageEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
