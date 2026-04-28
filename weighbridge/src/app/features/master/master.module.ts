import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { ClientsComponent } from './clients/clients.component';
import { MaterialsComponent } from './materials/materials.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: 'vehicles', component: VehiclesComponent, canActivate: [RoleGuard], data: { role: 'Admin' } },
  { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard] },
  { path: 'materials', component: MaterialsComponent, canActivate: [RoleGuard], data: { role: 'Admin' } }
];

@NgModule({
  declarations: [VehiclesComponent, ClientsComponent, MaterialsComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)]
})
export class MasterModule {}
