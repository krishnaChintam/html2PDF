import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabsContainerComponent } from './tabs/tabs-container/tabs-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TabsContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'htmlToPdf';
}
