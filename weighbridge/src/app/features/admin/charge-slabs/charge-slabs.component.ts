import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ChargeSlab } from '../../../core/models';

@Component({
  selector: 'app-charge-slabs',
  templateUrl: './charge-slabs.component.html',
  standalone: false
})
export class ChargeSlabsComponent implements OnInit {
  siteId = 1;
  slabs: ChargeSlab[] = [];
  loading = false;
  showForm = false;
  form: ChargeSlab = { siteId: 1, fromWeight: 0, toWeight: 0, chargeAmount: 0 };
  saving = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getChargeSlabs(this.siteId).subscribe({
      next: r => { this.slabs = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openForm(slab?: ChargeSlab): void {
    this.error = '';
    this.form = slab ? { ...slab } : { siteId: this.siteId, fromWeight: 0, toWeight: 0, chargeAmount: 0 };
    this.showForm = true;
  }

  save(): void {
    if (this.form.toWeight <= this.form.fromWeight) {
      this.error = 'To Weight must be greater than From Weight.';
      return;
    }
    this.error = '';
    this.saving = true;
    this.api.saveChargeSlab(this.form).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(s: ChargeSlab): void {
    if (!s.id || !confirm('Delete this charge slab?')) return;
    this.api.deleteChargeSlab(s.id).subscribe(() => this.load());
  }
}
