import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { RealtimeWeightService, ConnectionState } from '../../../core/realtime/realtime-weight.service';
import { PendingTicket, SecondWeighmentResponse, PaymentMode, WeightReadingDto } from '../../../core/models';

type Step = 'secondWeight' | 'charges' | 'paymentMode' | 'paymentAmount' | 'confirm';

@Component({
  selector: 'app-second-complete',
  templateUrl: './second-complete.component.html',
  standalone: false,
  styles: [`
    .step-row { display:flex; align-items:flex-start; gap:14px; padding:14px 20px; border-left:3px solid transparent; transition:all .15s ease; opacity:.45; }
    .step-row.active { border-left-color:#198754; opacity:1; background:rgba(25,135,84,.04); }
    .step-row.done { border-left-color:#0d6efd; opacity:.75; cursor:pointer; }
    .step-row.done:hover { opacity:.92; }
    .step-num { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; margin-top:2px; background:#dee2e6; color:#495057; }
    .step-row.active .step-num { background:#198754; color:#fff; }
    .step-row.done .step-num { background:#0d6efd; color:#fff; }
    .step-body { flex:1; min-width:0; }
    .step-lbl { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6c757d; margin-bottom:3px; }
    .step-row.active .step-lbl { color:#198754; }
    .step-val { font-size:.93rem; color:#212529; }
    .step-err { font-size:.78rem; color:#dc3545; margin-top:4px; }
    .step-hint { font-size:.67rem; color:#adb5bd; margin-top:3px; }
    .ticket-bar { background:#f8f9fa; border-bottom:1px solid #dee2e6; padding:10px 20px; display:flex; gap:24px; flex-wrap:wrap; align-items:center; }
    .tb-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#6c757d; }
    .tb-val { font-size:.88rem; font-weight:600; color:#212529; }

    /* Print overlay */
    .po-back { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:1055; display:flex; align-items:center; justify-content:center; }
    .po-card { background:#fff; border-radius:14px; width:480px; max-width:92vw; box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden; animation:poPop .18s ease; }
    @keyframes poPop { from{transform:scale(.93);opacity:0} to{transform:scale(1);opacity:1} }
    .po-head { background:linear-gradient(135deg,#198754 0%,#0d5e3e 100%); color:#fff; padding:20px 24px; }
    .po-body { padding:20px 24px; }
    .po-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #f3f4f6; font-size:.88rem; }
    .po-row:last-child { border-bottom:none; }
    .po-lbl { color:#6b7280; }
    .po-val { font-weight:600; color:#111827; }
    .po-foot { padding:14px 24px; background:#f9fafb; display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #e5e7eb; }

    @media print {
      .po-back { position:static !important; background:none !important; display:block !important; }
      .po-card { box-shadow:none !important; width:100% !important; max-width:none !important; border-radius:0 !important; }
    }
  `]
})
export class SecondCompleteComponent implements OnInit, OnDestroy {
  readonly steps: Step[] = ['secondWeight', 'charges', 'paymentMode', 'paymentAmount', 'confirm'];
  currentStepIndex = 0;
  fieldErrors: Partial<Record<Step, string>> = {};

  siteId = 1;
  ticketId = '';
  ticket: PendingTicket | null = null;
  loading = false;

  secondWeight: number | null = null;
  totalCharges = 0;
  paymentMode = PaymentMode.Cash;
  amountPaid = 0;

  captureVehicleImage = true;
  captureOperatorImage = false;
  printRequested = true;

  saving = false;
  error = '';
  result: SecondWeighmentResponse | null = null;
  showPrint = false;
  printCount = 0;
  printing = false;
  printError = '';

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

  get currentStep(): Step { return this.steps[this.currentStepIndex]; }
  isActive(s: Step): boolean { return this.currentStep === s; }
  isDone(s: Step): boolean { return this.currentStepIndex > this.steps.indexOf(s); }

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.params['id'];
    this.loadTicket();
    this.subs.add(
      this.realtimeWeight.weight$.subscribe(w => {
        this.liveWeight = w;
        if (w && this.isActive('secondWeight')) {
          this.secondWeight = w.weightKg;
        }
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.realtimeWeight.connectionState$.subscribe(s => { this.weightState = s; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/weighment/second']);
        if (key === 'CtrlP' && this.result?.printAllowed) this.doPrint();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private focusStep(step: Step): void {
    setTimeout(() => {
      (document.getElementById(`fld2-${step}`) as HTMLElement | null)?.focus();
    }, 40);
  }

  advance(step: Step): void {
    const err = this.validateStep(step);
    if (err) { this.fieldErrors[step] = err; this.cdr.markForCheck(); return; }
    this.fieldErrors[step] = '';
    const idx = this.steps.indexOf(step);
    if (idx < this.steps.length - 1) {
      this.currentStepIndex = idx + 1;
      this.focusStep(this.steps[idx + 1]);
      this.cdr.markForCheck();
    }
  }

  goBack(index: number): void {
    if (index < this.currentStepIndex) {
      this.currentStepIndex = index;
      this.focusStep(this.steps[index]);
      this.cdr.markForCheck();
    }
  }

  navigateDown(): void { this.advance(this.currentStep); }

  navigateUp(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.focusStep(this.currentStep);
      this.cdr.markForCheck();
    }
  }

  private validateStep(step: Step): string {
    if (step === 'secondWeight' && (!this.secondWeight || this.secondWeight <= 0))
      return 'Second weight is required and must be > 0.';
    return '';
  }

  // ─── Second weight ────────────────────────────────────────────────────────────

  useLiveWeight(): void {
    if (this.liveWeight) { this.secondWeight = this.liveWeight.weightKg; this.cdr.markForCheck(); }
  }

  onSecondWeightKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.advance('secondWeight'); }
    else if (e.key.toLowerCase() === 'l') { e.preventDefault(); this.useLiveWeight(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateDown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateUp(); }
  }

  // ─── Charges ─────────────────────────────────────────────────────────────────

  onChargesEnter(): void {
    this.amountPaid = this.totalCharges;
    this.advance('charges');
  }

  // ─── Payment mode ─────────────────────────────────────────────────────────────

  setPaymentMode(m: PaymentMode): void {
    this.paymentMode = m;
    this.advance('paymentMode');
  }

  onPaymentModeKey(e: KeyboardEvent): void {
    const modes = [PaymentMode.Cash, PaymentMode.Online, PaymentMode.Credit];
    const idx = modes.indexOf(this.paymentMode);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.paymentMode = modes[(idx + 1) % modes.length];
      this.cdr.markForCheck();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.paymentMode = modes[(idx - 1 + modes.length) % modes.length];
      this.cdr.markForCheck();
    } else if (e.key.toLowerCase() === 'c') { e.preventDefault(); this.setPaymentMode(PaymentMode.Cash); }
    else if (e.key.toLowerCase() === 'o') { e.preventDefault(); this.setPaymentMode(PaymentMode.Online); }
    else if (e.key.toLowerCase() === 'r') { e.preventDefault(); this.setPaymentMode(PaymentMode.Credit); }
    else if (e.key === 'Enter') this.advance('paymentMode');
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateDown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateUp(); }
  }

  payModeName(m: PaymentMode): string {
    return m === PaymentMode.Cash ? 'Cash' : m === PaymentMode.Online ? 'Online' : 'Credit';
  }

  // ─── Save & Print ─────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving) return;
    const err = this.validateStep('secondWeight');
    if (err) { this.fieldErrors['secondWeight'] = err; this.cdr.markForCheck(); return; }
    this.error = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.secondWeighment(this.siteId, {
      ticketId: this.ticketId,
      secondWeight: this.secondWeight!,
      totalCharges: this.totalCharges,
      amountPaid: this.amountPaid,
      captureVehicleImage: this.captureVehicleImage,
      captureOperatorImage: this.captureOperatorImage,
      printRequested: this.printRequested
    }).pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          this.result = res;
          this.showPrint = true;
          this.printCount = 0;
          this.cdr.markForCheck();
          setTimeout(() => (document.getElementById('s2-print-btn') as HTMLElement)?.focus(), 60);
        },
        error: err => {
          this.error = err?.error?.message || err?.error?.title || 'Save failed.';
          this.cdr.markForCheck();
        }
      });
  }

  doPrint(): void {
    if (this.printing || !this.result) return;
    this.printing = true;
    this.printError = '';
    this.cdr.markForCheck();
    this.api.sendToPrinterByNumber(this.siteId, this.result.ticketNumber)
      .pipe(finalize(() => { this.printing = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.printCount++; this.cdr.markForCheck(); },
        error: e => { this.printError = e?.error?.message || 'Print failed.'; this.cdr.markForCheck(); }
      });
  }

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
          setTimeout(() => this.focusStep('secondWeight'), 120);
        }
      });
  }
}
