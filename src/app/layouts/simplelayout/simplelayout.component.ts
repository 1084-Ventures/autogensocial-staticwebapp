import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-simplelayout',
  standalone: true,
  imports: [ToolbarComponent, RouterOutlet],
  templateUrl: './simplelayout.component.html',
  styleUrl: './simplelayout.component.scss'
})
export class SimplelayoutComponent {

}
