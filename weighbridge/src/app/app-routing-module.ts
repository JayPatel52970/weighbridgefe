import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'weighment',
        loadChildren: () => import('./features/weighment/weighment.module').then(m => m.WeighmentModule)
      },
      {
        path: 'master',
        loadChildren: () => import('./features/master/master.module').then(m => m.MasterModule)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
