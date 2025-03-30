import { Component } from '@angular/core';
import { ReportComponent } from '../../shared/components/report/report.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab3',
  standalone: true,
  imports: [ReportComponent, CommonModule],
  templateUrl: './tab3.component.html',
  styleUrl: './tab3.component.css'
})
export class Tab3Component {

}
