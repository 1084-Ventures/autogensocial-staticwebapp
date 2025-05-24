import { Component } from '@angular/core';
import { SidenavComponent } from '../../components/sidenav/sidenav.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mainlayout',
  standalone: true,
  imports: [CommonModule, SidenavComponent, ToolbarComponent, RouterOutlet],
  templateUrl: './mainlayout.component.html',
  styleUrl: './mainlayout.component.scss'
})
export class MainlayoutComponent {
}
