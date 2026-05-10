import { ChangeDetectorRef, Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { TicketDetailsDto, WeighmentStatus, FirstWeighType, PaymentMode } from '../../../core/models';

type Step = 'ticketNumber' | 'print';

@Component({
  selector: 'app-print-duplicate',
  templateUrl: './print-duplicate.component.html',
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

    .ti-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 20px; margin-top:12px; }
    .ti-row { display:flex; flex-direction:column; gap:2px; }
    .ti-lbl { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#6c757d; }
    .ti-val { font-size:.88rem; font-weight:600; color:#212529; }
    .ti-divider { grid-column:1/-1; border-top:1px solid #e9ecef; margin:4px 0; }
  `]
})
export class PrintDuplicateComponent implements OnInit, OnDestroy {
  readonly steps: Step[] = ['ticketNumber', 'print'];
  currentStepIndex = 0;

  siteId = 1;
  ticketSearch = '';
  lookingUp = false;
  lookupError = '';
  ticket: TicketDetailsDto | null = null;

  printing = false;
  printCount = 0;
  printError = '';

  WeighmentStatus = WeighmentStatus;
  FirstWeighType = FirstWeighType;
  PaymentMode = PaymentMode;

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private kb: KeyboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get currentStep(): Step { return this.steps[this.currentStepIndex]; }
  isActive(s: Step): boolean { return this.currentStep === s; }
  isDone(s: Step): boolean { return this.currentStepIndex > this.steps.indexOf(s); }

  @HostListener('mousedown', ['$event'])
  onHostMousedown(e: MouseEvent): void {
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
    }
  }

  ngOnInit(): void {
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/dashboard']);
        if (key === 'F1') this.router.navigate(['/weighment/first']);
        if (key === 'F2') this.router.navigate(['/weighment/second-direct']);
        if (key === 'F3') this.router.navigate(['/weighment/second']);
        if (key === 'F5') this.router.navigate(['/weighment/one-go']);
        if (key === 'CtrlP' && this.ticket) this.doPrint();
      })
    );
    setTimeout(() => (document.getElementById('fld-pd-ticketNumber') as HTMLElement)?.focus(), 100);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private focusStep(step: Step): void {
    setTimeout(() => {
      (document.getElementById(`fld-pd-${step}`) as HTMLElement | null)?.focus();
    }, 40);
  }

  goBack(index: number): void {
    if (index < this.currentStepIndex) {
      this.currentStepIndex = index;
      this.focusStep(this.steps[index]);
      this.cdr.markForCheck();
    }
  }

  onTicketNumberKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.lookupTicket(); }
  }

  lookupTicket(): void {
    const q = this.ticketSearch.trim().toUpperCase();
    if (!q) return;
    this.lookupError = '';
    this.lookingUp = true;
    this.cdr.markForCheck();
    this.api.getTicketByNumber(q, this.siteId)
      .pipe(finalize(() => { this.lookingUp = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: t => {
          this.ticket = t;
          this.currentStepIndex = 1;
          this.printCount = 0;
          this.printError = '';
          this.cdr.markForCheck();
          setTimeout(() => (document.getElementById('fld-pd-print') as HTMLElement)?.focus(), 60);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) {
            this.auth.logout(false);
          } else if (err.status === 404) {
            this.lookupError = 'Ticket not found or not permitted.';
          } else {
            this.lookupError = err?.error?.message || err?.error?.title || 'Failed to load ticket.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  doPrint(): void {
    if (this.printing || !this.ticket) return;
    this.printing = true;
    this.printError = '';
    this.cdr.markForCheck();
    this.api.sendToPrinterByNumber(this.siteId, this.ticket.ticketNumber)
      .pipe(finalize(() => { this.printing = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.printCount++; this.cdr.markForCheck(); },
        error: e => { this.printError = e?.error?.message || 'Print failed.'; this.cdr.markForCheck(); }
      });
  }

  resetForm(): void {
    this.ticket = null;
    this.ticketSearch = '';
    this.lookupError = '';
    this.currentStepIndex = 0;
    this.printing = false;
    this.printCount = 0;
    this.printError = '';
    this.cdr.markForCheck();
    setTimeout(() => (document.getElementById('fld-pd-ticketNumber') as HTMLElement)?.focus(), 60);
  }

  statusLabel(s: WeighmentStatus): string {
    return s === WeighmentStatus.Completed ? 'Completed'
      : s === WeighmentStatus.PendingSecondWeight ? 'Pending 2nd Weight'
      : 'Cancelled';
  }

  statusBadge(s: WeighmentStatus): string {
    return s === WeighmentStatus.Completed ? 'bg-success'
      : s === WeighmentStatus.PendingSecondWeight ? 'bg-warning text-dark'
      : 'bg-danger';
  }

  weighTypeName(t: FirstWeighType): string {
    return t === FirstWeighType.Gross ? 'Gross' : 'Tare';
  }

  payModeName(m: PaymentMode): string {
    return m === PaymentMode.Cash ? 'Cash' : m === PaymentMode.Online ? 'Online' : 'Credit';
  }
}
