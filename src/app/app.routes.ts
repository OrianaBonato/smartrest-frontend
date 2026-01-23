import { Routes } from '@angular/router';
import { TestComponent } from './pages/test/test.component';


export const routes: Routes = [
  { path: 'test', component: TestComponent },
  { path: '', redirectTo: 'test', pathMatch: 'full' }
];
