import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

import { SalaHomeComponent } from './features/sala/sala-home/sala-home.component';
import { CocinaHomeComponent } from './features/cocina/cocina-home/cocina-home.component';
import { BarraHomeComponent } from './features/barra/barra-home/barra-home.component';
import { AdminHomeComponent } from './features/admin/admin-home/admin-home.component';

import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { AlreadyLoggedGuard } from './core/guards/already-logged-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [AlreadyLoggedGuard] },

  {
    path: 'sala',
    component: SalaHomeComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SALA'] },
  },
  {
    path: 'cocina',
    component: CocinaHomeComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COCINA'] },
  },
  {
    path: 'barra',
    component: BarraHomeComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['BARRA'] },
  },
  {
    path: 'admin',
    component: AdminHomeComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
