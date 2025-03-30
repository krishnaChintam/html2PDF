import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ReportComponent } from './components/report/report.component';

@NgModule({
  imports: [
    CommonModule,
    HeaderComponent,
    LayoutComponent,
    ReportComponent
  ],
  exports: [
    HeaderComponent,
    LayoutComponent,
    ReportComponent
  ]
})
export class SharedModule { }
