import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { PendingTicket, SecondWeighmentResponse, PaymentMode } from '../../../core/models';

@Component({
  selector: 'app-second-complete',
  templateUrl: './second-complete.component.html',
  standalone: false
})
export class SecondCompleteComponent implements OnInit, OnDestroy {
  siteId = 1;
  ticketId = '';
  ticket: PendingTicket | null = null;
  loading = true;

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

  PaymentMode = PaymentMode;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private kb: KeyboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.params['id'];
    this.loadTicket();
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/weighment/second']);
        if (key === 'CtrlP' && this.result?.printAllowed) window.print();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private loadTicket(): void {
    this.api.getPendingTickets(this.siteId).subscribe({
      next: tickets => {
        this.ticket = tickets.find(t => t.ticketId === this.ticketId) || null;
        if (this.ticket) {
          this.totalCharges = this.ticket.totalCharges;
          this.amountPaid = this.ticket.totalCharges;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
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
    }).subscribe({
      next: res => { this.saving = false; this.result = res; },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message || err?.error?.title || 'Save failed.';
      }
    });
  }

  print(): void { window.print(); }
}
