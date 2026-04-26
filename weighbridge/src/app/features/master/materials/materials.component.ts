import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Material } from '../../../core/models';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  standalone: false
})
export class MaterialsComponent implements OnInit {
  search = '';
  materials: Material[] = [];
  loading = false;
  showForm = false;
  newName = '';
  saving = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.searchMaterials(this.search)
      .pipe(finalize(() => this.loading = false))
      .subscribe({ next: r => this.materials = r });
  }

  save(): void {
    if (!this.newName.trim()) { this.error = 'Name is required.'; return; }
    this.error = '';
    this.saving = true;
    this.api.createMaterial({ name: this.newName }).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.newName = ''; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(m: Material): void {
    if (!confirm(`Delete material ${m.name}?`)) return;
    this.api.deleteMaterial(m.id).subscribe(() => this.load());
  }
}
