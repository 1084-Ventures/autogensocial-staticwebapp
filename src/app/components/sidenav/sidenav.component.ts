import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  files = [
    { name: 'File 1', route: '/file1' },
    { name: 'File 2', route: '/file2' },
    { name: 'File 3', route: '/file3' }
  ];

  selectFile(file: { name: string, route: string }) {
    console.log('Selected file:', file.name);
  }
}
