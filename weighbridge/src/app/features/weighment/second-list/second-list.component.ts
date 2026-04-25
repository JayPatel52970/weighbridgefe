import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  loading = false;
  selectedIndex = -1;

  private search$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private kb: KeyboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load('');
    this.subs.add(
      this.search$.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(q => this.load(q))
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/dashboard']);
        if (key === 'F1') this.router.navigate(['/weighment/first']);
        if (key === 'ArrowDown') this.moveSelection(1);
        if (key === 'ArrowUp') this.moveSelection(-1);
        if (key === 'Enter' && this.selectedIndex >= 0) this.openSelected();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  load(q: string): void {
    this.loading = true;
    this.api.getPendingTickets(this.siteId, q).subscribe({
      next: r => { this.tickets = r; this.loading = false; this.selectedIndex = r.length > 0 ? 0 : -1; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(val: string): void {
    this.search = val;
    this.search$.next(val);
  }

  moveSelection(delta: number): void {
    if (!this.tickets.length) return;
    this.selectedIndex = Math.max(0, Math.min(this.tickets.length - 1, this.selectedIndex + delta));
    const row = document.querySelector(`#ticketRow${this.selectedIndex}`) as HTMLElement;
    row?.scrollIntoView({ block: 'nearest' });
  }

  openSelected(): void {
    const t = this.tickets[this.selectedIndex];
    if (t) this.router.navigate(['/weighment/second', t.ticketId]);
  }

  open(t: PendingTicket): void {
    this.router.navigate(['/weighment/second', t.ticketId]);
  }
}
