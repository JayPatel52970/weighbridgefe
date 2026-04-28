import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Client, UpsertClientRequest } from '../../../core/models';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  standalone: false
})
export class ClientsComponent implements OnInit {
  allClients: Client[] = [];
  filtered: Client[] = [];
  filterText = '';
  loading = false;

  showModal = false;
  isEdit = false;
  form: UpsertClientRequest = this.blankForm();
  saving = false;
  modalError = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.api.listClients(0, 2000)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.allClients = r; this.applyFilter(); },
        error: () => {}
      });
  }

  applyFilter(): void {
    const q = this.filterText.trim().toLowerCase();
    this.filtered = q
      ? this.allClients.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phoneNumber ?? '').toLowerCase().includes(q) ||
          (c.whatsAppNumber ?? '').toLowerCase().includes(q))
      : [...this.allClients];
    this.cdr.markForCheck();
  }

  blankForm(): UpsertClientRequest {
    return {
      id: null, name: '', phoneNumber: '', whatsAppNumber: '',
      isSendHalfTicketOnWhatsApp: false, isSendFullTicketOnWhatsApp: false,
      allowPrintBeforeFullPayment: false
    };
  }

  openAdd(): void {
    this.form = this.blankForm();
    this.isEdit = false;
    this.modalError = '';
    this.showModal = true;
    setTimeout(() => (document.getElementById('fld-clientName') as HTMLElement)?.focus(), 60);
  }

  openEdit(c: Client): void {
    this.form = {
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber ?? '',
      whatsAppNumber: c.whatsAppNumber ?? '',
      isSendHalfTicketOnWhatsApp: c.isSendHalfTicketOnWhatsApp ?? false,
      isSendFullTicketOnWhatsApp: c.isSendFullTicketOnWhatsApp ?? false,
      allowPrintBeforeFullPayment: c.allowPrintBeforeFullPayment ?? false
    };
    this.isEdit = true;
    this.modalError = '';
    this.showModal = true;
    setTimeout(() => (document.getElementById('fld-clientName') as HTMLElement)?.focus(), 60);
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (!this.form.name?.trim()) { this.modalError = 'Client name is required.'; return; }
    this.modalError = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.upsertClient(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.showModal = false; this.loadAll(); },
        error: e => { this.modalError = e?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  delete(c: Client): void {
    if (!confirm(`Delete client "${c.name}"?`)) return;
    this.api.deleteClient(c.id)
      .subscribe({ next: () => this.loadAll(), error: () => {} });
  }
}
