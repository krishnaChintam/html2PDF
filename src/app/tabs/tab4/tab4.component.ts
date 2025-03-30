import { Component } from '@angular/core';
import { ReportComponent } from '../../shared/components/report/report.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [ReportComponent, CommonModule],
  templateUrl: './tab4.component.html',
  styleUrl: './tab4.component.css'
})
export class Tab4Component {

}
