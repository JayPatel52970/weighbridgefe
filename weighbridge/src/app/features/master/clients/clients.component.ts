import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Client } from '../../../core/models';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  standalone: false
})
export class ClientsComponent implements OnInit {
  search = '';
  clients: Client[] = [];
  loading = false;
  showForm = false;
  form: Partial<Client> = {};
  saving = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.searchClients(this.search).subscribe({
      next: r => { this.clients = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (!this.form.name?.trim()) { this.error = 'Client name is required.'; return; }
    this.error = '';
    this.saving = true;
    this.api.createClient(this.form).subscribe({
      next: () => { this.saving = false; this.showForm = false; this.form = {}; this.load(); },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }

  delete(c: Client): void {
    if (!confirm(`Delete client ${c.name}?`)) return;
    this.api.deleteClient(c.id).subscribe(() => this.load());
  }
}
