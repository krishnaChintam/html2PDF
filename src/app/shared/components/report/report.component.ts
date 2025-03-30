import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadService } from '../../../services/download.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  @Input() reportId!: string;
  @Input() reportTitle: string = 'Report';
  @Input() headerLogo: string = 'assets/images/logo.png';
  @Input() headerTitle: string = 'Report Header';
  
  currentYear: number = new Date().getFullYear();
  
  @ViewChild('reportContent') reportContent!: ElementRef;
  
  constructor(private downloadService: DownloadService) { }
  
  downloadReport() {
    this.downloadService.downloadElementAsPdf(this.reportId, `${this.reportTitle}.pdf`);
  }
}
