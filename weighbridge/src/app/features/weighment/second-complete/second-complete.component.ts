import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { RealtimeWeightService, ConnectionState } from '../../../core/realtime/realtime-weight.service';
import { PendingTicket, SecondWeighmentResponse, PaymentMode, WeightReadingDto } from '../../../core/models';

@Component({
  selector: 'app-second-complete',
  templateUrl: './second-complete.component.html',
  standalone: false
})
export class SecondCompleteComponent implements OnInit, OnDestroy {
  siteId = 1;
  ticketId = '';
  ticket: PendingTicket | null = null;
  loading = false;

  secondWeight: number | null = null;
  totalCharges = 0;
  amountPaid = 0;
  paymentMode = PaymentMode.Cash;
  captureVehicleImage = true;
  captureOperatorImage = false;
  printRequested = true;

  saving = false;
  error = '';
  result: SecondWeighmentResponse | null = null;

  liveWeight: WeightReadingDto | null = null;
  weightState: ConnectionState = 'disconnected';

  PaymentMode = PaymentMode;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private kb: KeyboardService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private realtimeWeight: RealtimeWeightService
  ) {}

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.params['id'];
    this.loadTicket();
    this.subs.add(
      this.realtimeWeight.weight$.subscribe(w => { this.liveWeight = w; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.realtimeWeight.connectionState$.subscribe(s => { this.weightState = s; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/weighment/second']);
        if (key === 'CtrlP' && this.result?.printAllowed) window.print();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private loadTicket(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getPendingTickets(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: tickets => {
          this.ticket = tickets.find(t => t.ticketId === this.ticketId) || null;
          if (this.ticket) {
            this.totalCharges = this.ticket.totalCharges;
            this.amountPaid = this.ticket.totalCharges;
          }
          this.cdr.markForCheck();
        }
      });
  }

  save(): void {
    if (!this.secondWeight || this.secondWeight <= 0) {
      this.error = 'Second weight is required and must be greater than 0.';
      return;
    }
    this.error = '';
    this.saving = true;
    this.api.secondWeighment(this.siteId, {
      ticketId: this.ticketId,
      secondWeight: this.secondWeight,
      totalCharges: this.totalCharges,
      amountPaid: this.amountPaid,
      captureVehicleImage: this.captureVehicleImage,
      captureOperatorImage: this.captureOperatorImage,
      printRequested: this.printRequested
    }).pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => { this.result = res; this.cdr.markForCheck(); },
        error: err => {
          this.error = err?.error?.message || err?.error?.title || 'Save failed.';
          this.cdr.markForCheck();
        }
      });
  }

  print(): void { window.print(); }
}
