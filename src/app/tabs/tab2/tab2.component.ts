import { Component } from '@angular/core';
import { ReportComponent } from '../../shared/components/report/report.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab2',
  standalone: true,
  imports: [ReportComponent, FormsModule, CommonModule],
  templateUrl: './tab2.component.html',
  styleUrl: './tab2.component.css'
})
export class Tab2Component {

}
