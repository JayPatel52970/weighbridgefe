import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import {
  LedgerItem, Operator, TicketDetailsDto,
  WeighmentStatus, PaymentMode, FirstWeighType
} from '../../core/models';

type FilterStep = 'startDate' | 'endDate' | 'operator' | 'vehicle';
const FILTER_ORDER: FilterStep[] = ['startDate', 'endDate', 'operator', 'vehicle'];

@Component({
  selector: 'app-ticket-lookup',
  templateUrl: './ticket-lookup.component.html',
  standalone: false,
  styles: [`
    .tl-back { position:fixed; inset:0; background:rgba(0,0,0,.72); z-index:1055; display:flex; align-items:flex-start; justify-content:center; padding:20px 12px; overflow-y:auto; }
    .tl-panel { background:#fff; border-radius:12px; width:100%; max-width:1120px; display:flex; flex-direction:column; max-height:calc(100vh - 40px); box-shadow:0 32px 80px rgba(0,0,0,.5); animation:tlPop .15s ease; }
    @keyframes tlPop { from{transform:scale(.97);opacity:0} to{transform:scale(1);opacity:1} }
    .tl-head { padding:12px 18px; border-bottom:1px solid #dee2e6; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; background:#f8f9fa; border-radius:12px 12px 0 0; gap:10px; flex-wrap:wrap; }
    .tl-body { overflow-y:auto; flex:1; min-height:0; }
    .tl-foot-bar { padding:7px 18px; border-top:1px solid #dee2e6; flex-shrink:0; background:#f8f9fa; border-radius:0 0 12px 12px; font-size:.78rem; color:#6c757d; }
    .tl-table th { position:sticky; top:0; background:#f8f9fa; z-index:2; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6c757d; padding:8px 10px; white-space:nowrap; border-bottom:2px solid #dee2e6; }
    .tl-table td { font-size:.84rem; vertical-align:middle; padding:7px 10px; }
    .tl-highlight > td { background:#dbeafe !important; }
    .tl-row-btn { cursor:pointer; }
    .tl-row-btn:hover > td { background:#f0f9ff; }

    /* Sub-popup backdrop */
    .tl-sub-back { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:1065; display:flex; align-items:center; justify-content:center; padding:16px; }

    /* Filter card — no overflow:hidden so dropdown can escape */
    .tl-filter-card { background:#fff; border-radius:12px; width:100%; max-width:460px; box-shadow:0 16px 48px rgba(0,0,0,.45); animation:tlPop .15s ease; }
    .tl-filter-head { background:linear-gradient(135deg,#0d6efd 0%,#0a4aaa 100%); color:#fff; padding:14px 18px; display:flex; align-items:center; gap:8px; border-radius:12px 12px 0 0; }

    /* Filter step rows */
    .fs-row { display:flex; align-items:flex-start; gap:12px; padding:12px 18px; border-left:3px solid transparent; transition:all .12s; opacity:.45; }
    .fs-row.active { border-left-color:#0d6efd; opacity:1; background:rgba(13,110,253,.03); }
    .fs-row.done { border-left-color:#6c757d; opacity:.72; }
    .fs-num { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:700; flex-shrink:0; margin-top:1px; background:#dee2e6; color:#495057; }
    .fs-row.active .fs-num { background:#0d6efd; color:#fff; }
    .fs-row.done .fs-num { background:#6c757d; color:#fff; }
    .fs-body { flex:1; min-width:0; }
    .fs-lbl { font-size:.63rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6c757d; }
    .fs-row.active .fs-lbl { color:#0d6efd; }
    .fs-val { font-size:.9rem; color:#212529; }
    .fs-hint { font-size:.63rem; color:#adb5bd; margin-top:3px; }
    .fs-err { font-size:.73rem; color:#dc3545; margin-top:3px; }

    /* Detail card */
    .tl-detail-card { background:#fff; border-radius:12px; width:100%; max-width:700px; max-height:calc(100vh - 40px); overflow-y:auto; box-shadow:0 16px 48px rgba(0,0,0,.45); animation:tlPop .15s ease; }
    .tl-detail-head { background:linear-gradient(135deg,#198754 0%,#0d5e3e 100%); color:#fff; padding:16px 20px; border-radius:12px 12px 0 0; position:sticky; top:0; z-index:10; }
    .tl-detail-body { padding:14px 18px 4px; }
    .tl-detail-foot { padding:10px 18px; background:#f9fafb; display:flex; justify-content:flex-end; border-top:1px solid #e5e7eb; border-radius:0 0 12px 12px; position:sticky; bottom:0; }

    /* Weighment cards */
    .wm-card { border:1px solid #dee2e6; border-radius:8px; padding:12px; height:100%; }
    .wm-card-1 { border-left:3px solid #0d6efd; background:rgba(13,110,253,.03); }
    .wm-card-2 { border-left:3px solid #198754; background:rgba(25,135,84,.03); }
    .wm-card-pending { border:2px dashed #dee2e6; background:#f8f9fa; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#adb5bd; min-height:120px; }
    .wm-ch { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6c757d; margin-bottom:6px; display:flex; align-items:center; gap:4px; }
    .wm-wt { font-size:1.55rem; font-weight:800; color:#212529; line-height:1; }
    .wm-wt-unit { font-size:.9rem; font-weight:400; color:#6c757d; }
    .wm-dt { font-size:.76rem; color:#6c757d; margin-top:5px; }
    .wm-op { font-size:.8rem; color:#495057; margin-top:5px; }
    .wm-img-wrap { text-align:center; }
    .wm-img { width:86px; height:64px; object-fit:cover; border-radius:4px; border:1px solid #dee2e6; display:block; cursor:pointer; }
    .wm-img-lbl { font-size:.6rem; color:#6c757d; margin-top:2px; text-align:center; }

    /* Net weight banner */
    .net-banner { background:linear-gradient(135deg,#198754,#0d5e3e); color:#fff; border-radius:8px; padding:10px 14px; display:flex; justify-content:space-around; align-items:center; margin:10px 0; }
    .net-item { text-align:center; }
    .net-item-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; opacity:.78; }
    .net-item-val { font-size:.95rem; font-weight:700; }
    .net-item-val.big { font-size:1.35rem; }
    .net-sep { width:1px; background:rgba(255,255,255,.25); height:32px; }

    /* Payment strip */
    .pay-strip { display:flex; border:1px solid #dee2e6; border-radius:8px; overflow:hidden; margin:10px 0; }
    .pay-cell { flex:1; padding:8px 10px; text-align:center; border-right:1px solid #dee2e6; }
    .pay-cell:last-child { border-right:none; }
    .pay-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#6c757d; }
    .pay-val { font-size:.88rem; font-weight:600; color:#212529; margin-top:2px; }

    /* Info chips row */
    .chip { display:inline-flex; align-items:center; gap:4px; background:#f1f3f5; border:1px solid #dee2e6; border-radius:20px; padding:2px 9px; font-size:.78rem; color:#495057; }

    /* Audit bar */
    .audit-bar { font-size:.72rem; color:#9ca3af; padding:6px 0 12px; border-top:1px solid #f3f4f6; margin-top:8px; display:flex; flex-wrap:wrap; gap:10px; }
  `]
})
export class TicketLookupComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  readonly siteId = 1;

  // List
  allTickets: LedgerItem[] = [];
  filteredTickets: LedgerItem[] = [];
  highlightIndex = 0;
  loading = false;

  // Active filter display chips
  activeFromLabel = '';
  activeToLabel = '';
  activeVehicleLabel = '';
  activeOperatorLabel = '';

  // Applied filters
  appliedFrom = '';
  appliedTo = '';
  appliedVehicle = '';

  // Filter popup
  showFilter = false;
  filterStep: FilterStep = 'startDate';
  filterStartDateRaw = '';
  filterEndDateRaw = '';
  filterVehicle = '';
  filterOperatorSearch = '';
  filterOperatorId: string | null = null;
  filterOperatorSuggestions: Operator[] = [];
  filterOperatorHighlight = -1;
  filterDateError = '';

  // Operators master list
  allOperators: Operator[] = [];

  // Detail popup
  showDetail = false;
  detailLoading = false;
  detailTicket: TicketDetailsDto | null = null;
  detailError = '';

  WeighmentStatus = WeighmentStatus;
  PaymentMode = PaymentMode;
  FirstWeighType = FirstWeighType;

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private kb: KeyboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.listOperators(this.siteId).subscribe({
      next: ops => { this.allOperators = ops; this.cdr.markForCheck(); }
    });

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    this.appliedFrom = this.toISODate(weekAgo);
    this.appliedTo = this.toISODate(today);
    this.filterStartDateRaw = this.formatDisplay(weekAgo);
    this.filterEndDateRaw = this.formatDisplay(today);
    this.activeFromLabel = this.filterStartDateRaw;
    this.activeToLabel = this.filterEndDateRaw;
    this.loadTickets();

    this.subs.add(this.kb.shortcuts$.subscribe(key => {
      if (this.showDetail) {
        if (key === 'Escape' || key === 'F7') { this.showDetail = false; this.cdr.markForCheck(); }
        return;
      }
      if (this.showFilter) {
        if (key === 'Escape') { this.showFilter = false; this.cdr.markForCheck(); }
        return;
      }
      switch (key) {
        case 'ArrowDown': this.moveHighlight(1); break;
        case 'ArrowUp':   this.moveHighlight(-1); break;
        case 'Enter':     this.openDetailForHighlight(); break;
        case 'CtrlF':     this.openFilter(); break;
        case 'F7':
        case 'Escape':    this.closed.emit(); break;
      }
    }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  // ─── List navigation ──────────────────────────────────────────────────────

  private moveHighlight(delta: number): void {
    if (!this.filteredTickets.length) return;
    this.highlightIndex = Math.max(0, Math.min(this.filteredTickets.length - 1, this.highlightIndex + delta));
    this.scrollHighlightIntoView();
    this.cdr.markForCheck();
  }

  private scrollHighlightIntoView(): void {
    setTimeout(() => {
      const container = document.querySelector('.tl-body') as HTMLElement;
      const row = document.getElementById(`tl-row-${this.highlightIndex}`);
      if (!container || !row) return;
      const theadHeight = (container.querySelector('thead') as HTMLElement)?.offsetHeight ?? 36;
      const rowTop = row.offsetTop;
      const rowBottom = rowTop + row.offsetHeight;
      const visibleTop = container.scrollTop + theadHeight;
      const visibleBottom = container.scrollTop + container.clientHeight;
      if (rowTop < visibleTop) {
        container.scrollTop = rowTop - theadHeight;
      } else if (rowBottom > visibleBottom) {
        container.scrollTop = rowBottom - container.clientHeight;
      }
    });
  }

  clickRow(i: number): void {
    this.highlightIndex = i;
    this.openDetailForHighlight();
  }

  private openDetailForHighlight(): void {
    const t = this.filteredTickets[this.highlightIndex];
    if (!t) return;
    this.detailTicket = null;
    this.detailError = '';
    this.detailLoading = true;
    this.showDetail = true;
    this.cdr.markForCheck();
    this.api.getTicket(t.ticketId, this.siteId)
      .pipe(finalize(() => { this.detailLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: d => { this.detailTicket = d; this.cdr.markForCheck(); },
        error: e => { this.detailError = e?.error?.message || 'Failed to load ticket.'; this.cdr.markForCheck(); }
      });
  }

  // ─── Filter popup ─────────────────────────────────────────────────────────

  openFilter(): void {
    this.filterStep = 'startDate';
    this.filterDateError = '';
    this.filterOperatorSuggestions = [];
    this.filterOperatorHighlight = -1;
    this.showFilter = true;
    this.cdr.markForCheck();
    setTimeout(() => (document.getElementById('tl-flt-startDate') as HTMLInputElement)?.focus(), 40);
  }

  filterStepDone(step: FilterStep): boolean {
    return FILTER_ORDER.indexOf(this.filterStep) > FILTER_ORDER.indexOf(step);
  }

  onFilterStartDateEnter(): void {
    this.filterDateError = '';
    const d = this.parseDate(this.filterStartDateRaw);
    if (!d) { this.filterDateError = 'Invalid date — try 01/06/2025 or 1.6.25 or 1-6-25'; this.cdr.markForCheck(); return; }
    this.filterStartDateRaw = this.formatDisplay(d);
    this.filterStep = 'endDate';
    this.cdr.markForCheck();
    setTimeout(() => (document.getElementById('tl-flt-endDate') as HTMLInputElement)?.focus(), 40);
  }

  onFilterEndDateEnter(): void {
    this.filterDateError = '';
    const d = this.parseDate(this.filterEndDateRaw);
    if (!d) { this.filterDateError = 'Invalid date — try 01/06/2025 or 1.6.25 or 1-6-25'; this.cdr.markForCheck(); return; }
    this.filterEndDateRaw = this.formatDisplay(d);
    this.filterStep = 'operator';
    this.cdr.markForCheck();
    setTimeout(() => (document.getElementById('tl-flt-operator') as HTMLInputElement)?.focus(), 40);
  }

  onFilterOperatorFocus(): void {
    this.filterOperatorSuggestions = this.allOperators;
    this.cdr.markForCheck();
  }

  onFilterOperatorInput(val: string): void {
    this.filterOperatorSearch = val;
    this.filterOperatorId = null;
    this.filterOperatorHighlight = -1;
    const q = val.trim().toLowerCase();
    this.filterOperatorSuggestions = q
      ? this.allOperators.filter(o => o.name.toLowerCase().includes(q))
      : this.allOperators;
    this.cdr.markForCheck();
  }

  onFilterOperatorArrow(delta: number): void {
    if (!this.filterOperatorSuggestions.length) return;
    this.filterOperatorHighlight = Math.max(0, Math.min(this.filterOperatorSuggestions.length - 1, this.filterOperatorHighlight + delta));
    this.cdr.markForCheck();
  }

  selectFilterOperator(o: Operator): void {
    this.filterOperatorId = o.id;
    this.filterOperatorSearch = o.name;
    this.filterOperatorSuggestions = [];
    this.filterOperatorHighlight = -1;
    this.advanceFilterToVehicle();
  }

  onFilterOperatorEnter(): void {
    if (this.filterOperatorHighlight >= 0 && this.filterOperatorHighlight < this.filterOperatorSuggestions.length) {
      this.selectFilterOperator(this.filterOperatorSuggestions[this.filterOperatorHighlight]);
      return;
    }
    if (this.filterOperatorSearch.trim()) {
      const exact = this.allOperators.find(o => o.name.toLowerCase() === this.filterOperatorSearch.trim().toLowerCase());
      if (exact) this.filterOperatorId = exact.id;
    }
    this.filterOperatorSuggestions = [];
    this.advanceFilterToVehicle();
  }

  private advanceFilterToVehicle(): void {
    this.filterStep = 'vehicle';
    this.cdr.markForCheck();
    setTimeout(() => (document.getElementById('tl-flt-vehicle') as HTMLInputElement)?.focus(), 40);
  }

  applyFilter(): void {
    const from = this.parseDate(this.filterStartDateRaw);
    const to = this.parseDate(this.filterEndDateRaw);
    if (!from || !to) { this.filterDateError = 'Invalid date range.'; this.cdr.markForCheck(); return; }

    this.appliedFrom = this.toISODate(from);
    this.appliedTo = this.toISODate(to);
    this.appliedVehicle = this.filterVehicle.trim();

    this.activeFromLabel = this.formatDisplay(from);
    this.activeToLabel = this.formatDisplay(to);
    this.activeVehicleLabel = this.appliedVehicle;
    this.activeOperatorLabel = this.filterOperatorSearch.trim();

    this.showFilter = false;
    this.highlightIndex = 0;
    this.loadTickets();
    this.cdr.markForCheck();
  }

  // ─── Data ─────────────────────────────────────────────────────────────────

  private loadTickets(): void {
    this.loading = true;
    this.filteredTickets = [];
    this.cdr.markForCheck();
    const loader = this.auth.hasRole('Admin')
      ? this.api.getAdminLedger(this.siteId, { from: this.appliedFrom, to: this.appliedTo, take: 500 })
      : this.api.getLedger(this.siteId, { from: this.appliedFrom, to: this.appliedTo, take: 500 });
    loader
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: items => {
          this.allTickets = [...items].sort((a, b) => b.serialNumber - a.serialNumber);
          this.applyClientFilter();
        }
      });
  }

  private applyClientFilter(): void {
    let result = [...this.allTickets];
    if (this.appliedVehicle) {
      const v = this.appliedVehicle.toUpperCase();
      result = result.filter(t => t.vehicleLicensePlate.toUpperCase().includes(v));
    }
    this.filteredTickets = result;
    this.highlightIndex = 0;
    this.cdr.markForCheck();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  parseDate(s: string): Date | null {
    if (!s?.trim()) return null;
    const n = s.trim().replace(/[.\-\s]+/g, '/');
    const parts = n.split('/').filter(Boolean);
    if (parts.length !== 3) return null;
    let d = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);
    if ([d, m, y].some(isNaN)) return null;
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
  }

  private toISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatDisplay(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  statusLabel(s: WeighmentStatus): string {
    return s === WeighmentStatus.Completed ? 'Completed' : s === WeighmentStatus.PendingSecondWeight ? 'Pending' : 'Cancelled';
  }

  statusClass(s: WeighmentStatus): string {
    return s === WeighmentStatus.Completed ? 'bg-success' : s === WeighmentStatus.PendingSecondWeight ? 'bg-warning text-dark' : 'bg-danger';
  }

  payModeName(m: PaymentMode): string {
    return m === PaymentMode.Cash ? 'Cash' : m === PaymentMode.Online ? 'Online' : 'Credit';
  }

  weighTypeName(t: FirstWeighType): string {
    return t === FirstWeighType.Gross ? 'Gross' : 'Tare';
  }

  grossOf(t: LedgerItem): number | null {
    return t.firstWeighType === FirstWeighType.Gross ? t.firstWeight : t.secondWeight;
  }

  tareOf(t: LedgerItem): number | null {
    return t.firstWeighType === FirstWeighType.Tare ? t.firstWeight : t.secondWeight;
  }

  openImg(url: string): void {
    window.open(url, '_blank');
  }
}
