import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidenavComponent } from './sidenav.component';

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a list of files', () => {
    expect(component.files.length).toBe(3);
  });

  it('should select a file', () => {
    spyOn(console, 'log');
    const file = { name: 'File 1', route: '/file1' };
    component.selectFile(file);
    expect(console.log).toHaveBeenCalledWith('Selected file:', 'File 1');
  });
});
