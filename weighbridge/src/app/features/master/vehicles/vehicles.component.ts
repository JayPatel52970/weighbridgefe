import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Vehicle, VehicleType } from '../../../core/models';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  standalone: false
})
export class VehiclesComponent implements OnInit {
  search = '';
  vehicles: Vehicle[] = [];
  loading = false;
  showForm = false;
  form: Partial<Vehicle> = { type: VehicleType.Truck };
  saving = false;
  error = '';
  imageFile: File | null = null;
  uploadingImageFor: string | null = null;

  VehicleType = VehicleType;
  vehicleTypes = Object.entries(VehicleType).filter(([, v]) => typeof v === 'number') as [string, number][];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.searchVehicles(this.search).subscribe({
      next: r => { this.vehicles = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (!this.form.licensePlate?.trim()) { this.error = 'License plate is required.'; return; }
    this.error = '';
    this.saving = true;
    this.api.createVehicle({ ...this.form, licensePlate: this.form.licensePlate!.toUpperCase() }).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.form = { type: VehicleType.Truck }; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(v: Vehicle): void {
    if (!confirm(`Delete vehicle ${v.licensePlate}?`)) return;
    this.api.deleteVehicle(v.id).subscribe(() => this.load());
  }

  onImageSelected(e: Event, vehicleId: string): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImageFor = vehicleId;
    this.api.uploadVehicleTypeImage(vehicleId, file).subscribe({
      next: () => { this.uploadingImageFor = null; this.load(); },
      error: () => { this.uploadingImageFor = null; }
    });
  }
}
