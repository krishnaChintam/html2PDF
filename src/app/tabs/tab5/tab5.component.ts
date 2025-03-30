import { Component } from '@angular/core';
import { ReportComponent } from '../../shared/components/report/report.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab5',
  standalone: true,
  imports: [ReportComponent, CommonModule],
  templateUrl: './tab5.component.html',
  styleUrl: './tab5.component.css'
})
export class Tab5Component {

}
