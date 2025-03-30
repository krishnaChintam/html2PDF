import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tab1Component } from '../tab1/tab1.component';
import { Tab2Component } from '../tab2/tab2.component';
import { Tab3Component } from '../tab3/tab3.component';
import { Tab4Component } from '../tab4/tab4.component';
import { Tab5Component } from '../tab5/tab5.component';
import { DownloadService } from '../../services/download.service';

declare var bootstrap: any;

@Component({
  selector: 'app-tabs-container',
  standalone: true,
  imports: [
    CommonModule,
    Tab1Component,
    Tab2Component,
    Tab3Component,
    Tab4Component,
    Tab5Component
  ],
  templateUrl: './tabs-container.component.html',
  styleUrl: './tabs-container.component.css'
})
export class TabsContainerComponent implements AfterViewInit {
  constructor(private downloadService: DownloadService) { }

  ngAfterViewInit() {
    // Initialize Bootstrap tabs
    const tabElements = document.querySelectorAll('#myTab button');
    tabElements.forEach(tab => {
      new bootstrap.Tab(tab);
    });
  }

  /**
   * Downloads all reports as a single PDF
   */
  downloadAllReports(): void {
    // IDs of all report elements
    const reportIds = [
      'report-tab1', // Sales Report
      'report-tab2', // Financial Report
      'report-tab3', // HR Report
      'report-tab4', // Marketing Report
      'report-tab5'  // Operations Report
    ];
    
    // Download combined PDF
    this.downloadService.downloadCombinedPdf(reportIds, 'Company-Reports-Collection');
  }
}
