import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';

export type NavItem = 'brand' | 'upload' | 'generate' | 'settings' | null;

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MaterialModule, RouterModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  @Input() appName = 'AutoGen Social';
  @Output() toggleMenu = new EventEmitter<void>();
  @Output() navSelected = new EventEmitter<NavItem>();

  onNavSelect(item: NavItem) {
    this.navSelected.emit(item);
  }

  onSignOut() {
    window.location.href = '/.auth/logout';
  }
}
