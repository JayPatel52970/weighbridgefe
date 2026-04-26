import { ChangeDetectorRef, Component } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { VehicleType } from '../../../core/models';

@Component({
  selector: 'app-uploads',
  templateUrl: './uploads.component.html',
  standalone: false
})
export class UploadsComponent {
  siteId = 1;
  selectedVehicleType = 'Truck';
  genericFile: File | null = null;
  genericResult = '';
  genericError = '';
  uploadingGeneric = false;

  VehicleType = VehicleType;
  vehicleTypeNames = Object.keys(VehicleType).filter(k => isNaN(Number(k)));

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  onGenericFile(e: Event): void {
    this.genericFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  uploadGeneric(): void {
    if (!this.genericFile) return;
    this.genericError = '';
    this.genericResult = '';
    this.uploadingGeneric = true;
    this.cdr.markForCheck();
    this.api.uploadVehicleTypeGenericImage(this.genericFile, this.selectedVehicleType, this.siteId)
      .pipe(finalize(() => { this.uploadingGeneric = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: url => { this.genericResult = url; this.cdr.markForCheck(); },
        error: err => { this.genericError = err?.error?.message || 'Upload failed.'; this.cdr.markForCheck(); }
      });
  }
}
