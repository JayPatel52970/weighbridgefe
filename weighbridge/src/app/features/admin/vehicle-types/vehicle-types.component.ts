import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { VehicleTypeConfig, UpsertVehicleTypeRequest } from '../../../core/models';

@Component({
  selector: 'app-vehicle-types',
  templateUrl: './vehicle-types.component.html',
  standalone: false
})
export class VehicleTypesComponent implements OnInit {
  siteId = 1;
  items: VehicleTypeConfig[] = [];
  loading = false;
  showForm = false;
  isEditing = false;
  form: UpsertVehicleTypeRequest = { id: null, siteId: 1, code: '', displayName: '', price: 0, existingImageUrl: null };
  imageFile: File | null = null;
  imagePreview: string | null = null;
  saving = false;
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getVehicleTypes(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: r => { this.items = r; this.cdr.markForCheck(); } });
  }

  openAdd(): void {
    this.error = '';
    this.isEditing = false;
    this.form = { id: null, siteId: this.siteId, code: '', displayName: '', price: 0, existingImageUrl: null };
    this.imageFile = null;
    this.imagePreview = null;
    this.showForm = true;
  }

  openEdit(item: VehicleTypeConfig): void {
    this.error = '';
    this.isEditing = true;
    this.form = { id: item.id, siteId: item.siteId, code: item.code, displayName: item.displayName, price: item.price, existingImageUrl: item.imageUrl ?? null };
    this.imageFile = null;
    this.imagePreview = null;
    this.showForm = true;
  }

  onImageSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => { this.imagePreview = ev.target?.result as string; this.cdr.markForCheck(); };
      reader.readAsDataURL(file);
    } else {
      this.imagePreview = null;
    }
  }

  save(): void {
    if (!this.form.code?.trim()) { this.error = 'Code is required.'; return; }
    if (!this.form.displayName?.trim()) { this.error = 'Display name is required.'; return; }
    if (this.form.price < 0) { this.error = 'Price must be 0 or greater.'; return; }
    this.error = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.upsertVehicleType({ ...this.form, code: this.form.code.trim().toUpperCase() }, this.imageFile ?? undefined)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showForm = false; this.imageFile = null; this.imagePreview = null; this.load(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  delete(item: VehicleTypeConfig): void {
    if (!confirm(`Delete "${item.displayName}" (${item.code})?`)) return;
    this.api.deleteVehicleType(item.id).subscribe({
      next: () => this.load(),
      error: err => alert(err?.error?.message || 'Delete failed.')
    });
  }

  cancel(): void {
    this.showForm = false;
    this.error = '';
    this.imageFile = null;
    this.imagePreview = null;
  }
}
