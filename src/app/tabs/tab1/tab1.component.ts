import { Component } from '@angular/core';
import { ReportComponent } from '../../shared/components/report/report.component';

@Component({
  selector: 'app-tab1',
  standalone: true,
  imports: [ReportComponent],
  templateUrl: './tab1.component.html',
  styleUrl: './tab1.component.css'
})
export class Tab1Component {

}
