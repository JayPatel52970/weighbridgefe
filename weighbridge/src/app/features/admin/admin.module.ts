import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';
import { ChargeSlabsComponent } from './charge-slabs/charge-slabs.component';
import { CamerasComponent } from './cameras/cameras.component';
import { UsersComponent } from './users/users.component';
import { UploadsComponent } from './uploads/uploads.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: 'settings', component: SettingsComponent, canActivate: [RoleGuard], data: { role: 'Admin' } },
  { path: 'charge-slabs', component: ChargeSlabsComponent, canActivate: [RoleGuard], data: { role: 'Admin' } },
  { path: 'cameras', component: CamerasComponent, canActivate: [RoleGuard], data: { role: 'Admin' } },
  { path: 'users', component: UsersComponent, canActivate: [RoleGuard], data: { role: 'Admin' } },
  { path: 'uploads', component: UploadsComponent, canActivate: [RoleGuard], data: { role: 'Admin' } }
];

@NgModule({
  declarations: [SettingsComponent, ChargeSlabsComponent, CamerasComponent, UsersComponent, UploadsComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
