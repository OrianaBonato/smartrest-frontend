import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

import { SalaHomeComponent } from './features/sala/sala-home/sala-home.component';
import { CocinaHomeComponent } from './features/cocina/cocina-home/cocina-home.component';
import { BarraHomeComponent } from './features/barra/barra-home/barra-home.component';
import { AdminHomeComponent } from './features/admin/admin-home/admin-home.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: 'sala', component: SalaHomeComponent },
  { path: 'cocina', component: CocinaHomeComponent },
  { path: 'barra', component: BarraHomeComponent },
  { path: 'admin', component: AdminHomeComponent },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
