import { Routes } from '@angular/router';
import { TabsContainerComponent } from './tabs/tabs-container/tabs-container.component';

export const routes: Routes = [
  { path: '', component: TabsContainerComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
