import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
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

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getChargeSlabs(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: r => { this.slabs = r; this.cdr.markForCheck(); } });
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
    this.cdr.markForCheck();
    this.api.saveChargeSlab(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showForm = false; this.load(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  delete(s: ChargeSlab): void {
    if (!s.id || !confirm('Delete this charge slab?')) return;
    this.api.deleteChargeSlab(s.id).subscribe(() => this.load());
  }
}
