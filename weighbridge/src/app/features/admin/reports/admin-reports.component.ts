import { ChangeDetectorRef, Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  TodaysCollection, AdminLedgerItem,
  WeighmentStatus, PaymentStatus, PaymentMode, FirstWeighType
} from '../../../core/models';

type Tab = 'collection' | 'ledger' | 'vehicle';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html',
  standalone: false
})
export class AdminReportsComponent {
  siteId = 1;
  activeTab: Tab = 'collection';

  collectionDate = new Date().toISOString().slice(0, 10);
  collectionUser = '';
  collection: TodaysCollection | null = null;
  collectionLoading = false;
  collectionError = '';

  ledgerFrom = '';
  ledgerTo = '';
  ledgerSearch = '';
  ledgerStatus: WeighmentStatus | '' = '';
  ledgerUser = '';
  ledgerItems: AdminLedgerItem[] = [];
  ledgerLoading = false;
  ledgerError = '';

  vehiclePlate = '';
  vehicleFrom = '';
  vehicleTo = '';
  vehicleUser = '';
  vehicleItems: AdminLedgerItem[] = [];
  vehicleLoading = false;
  vehicleError = '';

  WeighmentStatus = WeighmentStatus;
  PaymentStatus = PaymentStatus;
  PaymentMode = PaymentMode;
  FirstWeighType = FirstWeighType;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  loadCollection(): void {
    this.collectionLoading = true;
    this.collectionError = '';
    this.cdr.markForCheck();
    this.api.getAdminTodaysCollection(this.siteId, this.collectionDate, this.collectionUser.trim() || undefined)
      .pipe(finalize(() => { this.collectionLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.collection = r; this.cdr.markForCheck(); },
        error: err => { this.collectionError = err?.error?.message || 'Failed to load.'; this.cdr.markForCheck(); }
      });
  }

  loadLedger(): void {
    this.ledgerLoading = true;
    this.ledgerError = '';
    this.cdr.markForCheck();
    this.api.getAdminLedger(this.siteId, {
      from: this.ledgerFrom || undefined,
      to: this.ledgerTo || undefined,
      search: this.ledgerSearch.trim() || undefined,
      status: this.ledgerStatus !== '' ? this.ledgerStatus : undefined,
      createdBy: this.ledgerUser.trim() || undefined
    }).pipe(finalize(() => { this.ledgerLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.ledgerItems = r; this.cdr.markForCheck(); },
        error: err => { this.ledgerError = err?.error?.message || 'Failed to load.'; this.cdr.markForCheck(); }
      });
  }

  loadVehicleReport(): void {
    if (!this.vehiclePlate.trim()) return;
    this.vehicleLoading = true;
    this.vehicleError = '';
    this.cdr.markForCheck();
    this.api.getAdminVehicleReport(this.siteId, {
      licensePlate: this.vehiclePlate.trim().toUpperCase(),
      from: this.vehicleFrom || undefined,
      to: this.vehicleTo || undefined,
      createdBy: this.vehicleUser.trim() || undefined
    }).pipe(finalize(() => { this.vehicleLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.vehicleItems = r; this.cdr.markForCheck(); },
        error: err => { this.vehicleError = err?.error?.message || 'Failed to load.'; this.cdr.markForCheck(); }
      });
  }

  statusLabel(s: WeighmentStatus): string {
    if (s === WeighmentStatus.Completed) return 'Completed';
    if (s === WeighmentStatus.PendingSecondWeight) return 'Pending 2nd';
    return 'Cancelled';
  }

  statusBadge(s: WeighmentStatus): string {
    if (s === WeighmentStatus.Completed) return 'bg-success';
    if (s === WeighmentStatus.PendingSecondWeight) return 'bg-warning text-dark';
    return 'bg-secondary';
  }

  payStatusLabel(s: PaymentStatus): string {
    if (s === PaymentStatus.Paid) return 'Paid';
    if (s === PaymentStatus.PartiallyPaid) return 'Partial';
    return 'Pending';
  }

  payStatusBadge(s: PaymentStatus): string {
    if (s === PaymentStatus.Paid) return 'bg-success';
    if (s === PaymentStatus.PartiallyPaid) return 'bg-warning text-dark';
    return 'bg-danger';
  }

  payModeLabel(m: PaymentMode): string {
    if (m === PaymentMode.Cash) return 'Cash';
    if (m === PaymentMode.Online) return 'Online';
    return 'Credit';
  }

  weighTypeLabel(t: FirstWeighType): string {
    return t === FirstWeighType.Gross ? 'Gross' : 'Tare';
  }

  sum(items: AdminLedgerItem[], field: 'totalCharges' | 'amountPaid'): number {
    return items.reduce((acc, i) => acc + i[field], 0);
  }
}
