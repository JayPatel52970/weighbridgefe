import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Vehicle, VehicleTypeConfig } from '../../../core/models';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  standalone: false
})
export class VehiclesComponent implements OnInit {
  search = '';
  vehicles: Vehicle[] = [];
  vehicleTypes: VehicleTypeConfig[] = [];
  loading = false;
  showForm = false;
  form: Partial<Vehicle> = { vehicleTypeId: null };
  saving = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    this.api.getVehicleTypes(1).subscribe({ next: r => this.vehicleTypes = r });
  }

  load(): void {
    this.loading = true;
    this.api.searchVehicles(this.search)
      .pipe(finalize(() => this.loading = false))
      .subscribe({ next: r => this.vehicles = r });
  }

  typeName(vehicleTypeId: string | null): string {
    if (!vehicleTypeId) return '—';
    return this.vehicleTypes.find(t => t.id === vehicleTypeId)?.displayName ?? '—';
  }

  typeImage(vehicleTypeId: string | null): string | null {
    if (!vehicleTypeId) return null;
    return this.vehicleTypes.find(t => t.id === vehicleTypeId)?.imageUrl ?? null;
  }

  save(): void {
    if (!this.form.licensePlate?.trim()) { this.error = 'License plate is required.'; return; }
    this.error = '';
    this.saving = true;
    this.api.createVehicle({ ...this.form, licensePlate: this.form.licensePlate!.toUpperCase() }).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.form = { vehicleTypeId: null }; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(v: Vehicle): void {
    if (!confirm(`Delete vehicle ${v.licensePlate}?`)) return;
    this.api.deleteVehicle(v.id).subscribe(() => this.load());
  }
}
