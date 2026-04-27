import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { PendingTicket } from '../../../core/models';

@Component({
  selector: 'app-second-list',
  templateUrl: './second-list.component.html',
  standalone: false
})
export class SecondListComponent implements OnInit, OnDestroy {
  siteId = 1;
  search = '';
  tickets: PendingTicket[] = [];
  filtered: PendingTicket[] = [];
  loading = false;
  selectedIndex = -1;

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private kb: KeyboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/dashboard']);
        if (key === 'F1') this.router.navigate(['/weighment/first']);
        if (key === 'F2') this.router.navigate(['/weighment/second-direct']);
        if (key === 'F5') this.router.navigate(['/weighment/one-go']);
        if (key === 'ArrowDown') this.moveSelection(1);
        if (key === 'ArrowUp') this.moveSelection(-1);
        if (key === 'Enter' && this.selectedIndex >= 0) this.openSelected();
      })
    );
    setTimeout(() => (document.getElementById('search-input') as HTMLElement)?.focus(), 100);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getPendingTickets(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => {
          this.tickets = r;
          this.applyFilter();
        }
      });
  }

  onSearch(val: string): void {
    this.search = val;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.search.trim().toLowerCase();
    this.filtered = q
      ? this.tickets.filter(t =>
          t.vehicleLicensePlate.toLowerCase().includes(q) ||
          t.ticketNumber.toLowerCase().includes(q) ||
          t.serialNumber.toString().includes(q) ||
          (t.clientName?.toLowerCase().includes(q) ?? false) ||
          (t.driverName?.toLowerCase().includes(q) ?? false)
        )
      : [...this.tickets];
    this.selectedIndex = this.filtered.length > 0 ? 0 : -1;
    this.cdr.markForCheck();
  }

  onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') { e.preventDefault(); this.moveSelection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.moveSelection(-1); }
    else if (e.key === 'Enter' && this.selectedIndex >= 0) { e.preventDefault(); this.openSelected(); }
  }

  moveSelection(delta: number): void {
    if (!this.filtered.length) return;
    this.selectedIndex = Math.max(0, Math.min(this.filtered.length - 1, this.selectedIndex + delta));
    this.cdr.markForCheck();
    const row = document.getElementById(`ticketRow${this.selectedIndex}`);
    row?.scrollIntoView({ block: 'nearest' });
  }

  openSelected(): void {
    const t = this.filtered[this.selectedIndex];
    if (t) this.router.navigate(['/weighment/second', t.ticketId]);
  }

  open(t: PendingTicket): void {
    this.router.navigate(['/weighment/second', t.ticketId]);
  }
}
