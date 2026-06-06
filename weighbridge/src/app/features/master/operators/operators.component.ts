import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Operator, CreateOperatorRequest } from '../../../core/models';

@Component({
  selector: 'app-operators',
  templateUrl: './operators.component.html',
  standalone: false
})
export class OperatorsComponent implements OnInit {
  siteId = 1;
  allOperators: Operator[] = [];
  filtered: Operator[] = [];
  filterText = '';
  loading = false;

  showModal = false;
  isEdit = false;
  editId: string | null = null;
  formName = '';
  saving = false;
  modalError = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.api.listOperators(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: r => { this.allOperators = r; this.applyFilter(); } });
  }

  applyFilter(): void {
    const q = this.filterText.trim().toLowerCase();
    this.filtered = q
      ? this.allOperators.filter(o => o.name.toLowerCase().includes(q))
      : [...this.allOperators];
    this.cdr.markForCheck();
  }

  openAdd(): void {
    this.formName = '';
    this.isEdit = false;
    this.editId = null;
    this.modalError = '';
    this.showModal = true;
    setTimeout(() => (document.getElementById('fld-opName') as HTMLElement)?.focus(), 60);
  }

  openEdit(o: Operator): void {
    this.formName = o.name;
    this.isEdit = true;
    this.editId = o.id;
    this.modalError = '';
    this.showModal = true;
    setTimeout(() => (document.getElementById('fld-opName') as HTMLElement)?.focus(), 60);
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (!this.formName.trim()) { this.modalError = 'Name is required.'; return; }
    this.modalError = '';
    this.saving = true;
    this.cdr.markForCheck();

    const obs = this.isEdit && this.editId
      ? this.api.updateOperator(this.editId, { siteId: this.siteId, name: this.formName.trim() })
      : this.api.createOperator({ id: null, siteId: this.siteId, name: this.formName.trim() });

    obs.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showModal = false; this.loadAll(); },
        error: e => { this.modalError = e?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  delete(o: Operator): void {
    if (!confirm(`Delete operator "${o.name}"?`)) return;
    this.api.deleteOperator(o.id)
      .subscribe({ next: () => this.loadAll(), error: () => {} });
  }
}
