import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentTextEditorComponent } from './content-text-editor.component';

describe('ContentTextEditorComponent', () => {
  let component: ContentTextEditorComponent;
  let fixture: ComponentFixture<ContentTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentTextEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
