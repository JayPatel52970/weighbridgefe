import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { RealtimeWeightService, ConnectionState } from '../../../core/realtime/realtime-weight.service';
import {
  Vehicle, Client, Material,
  FirstWeighmentRequest, FirstWeighmentResponse,
  VehicleType, FirstWeighType, PaymentMode, WeightReadingDto
} from '../../../core/models';

type Step = 'weighType' | 'vehicle' | 'vehicleType' | 'charges' | 'paymentMode' | 'paymentAmount' | 'material' | 'client' | 'driverName' | 'confirm';

@Component({
  selector: 'app-first-weighment',
  templateUrl: './first-weighment.component.html',
  standalone: false,
  styles: [`
    .step-row { display:flex; align-items:flex-start; gap:14px; padding:14px 20px; border-left:3px solid transparent; transition:all .15s ease; opacity:.45; }
    .step-row.active { border-left-color:#0d6efd; opacity:1; background:rgba(13,110,253,.04); }
    .step-row.done { border-left-color:#198754; opacity:.75; cursor:pointer; }
    .step-row.done:hover { opacity:.92; }
    .step-num { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; flex-shrink:0; margin-top:2px; background:#dee2e6; color:#495057; }
    .step-row.active .step-num { background:#0d6efd; color:#fff; }
    .step-row.done .step-num { background:#198754; color:#fff; }
    .step-body { flex:1; min-width:0; }
    .step-lbl { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6c757d; margin-bottom:3px; }
    .step-row.active .step-lbl { color:#0d6efd; }
    .step-val { font-size:.93rem; color:#212529; }
    .step-err { font-size:.78rem; color:#dc3545; margin-top:4px; }
    .step-hint { font-size:.67rem; color:#adb5bd; margin-top:3px; }

    /* Print overlay */
    .po-back { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:1055; display:flex; align-items:center; justify-content:center; }
    .po-card { background:#fff; border-radius:14px; width:460px; max-width:92vw; box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden; animation:poPop .18s ease; }
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
export class FirstWeighmentComponent implements OnInit, OnDestroy {
  readonly steps: Step[] = ['weighType', 'vehicle', 'vehicleType', 'charges', 'paymentMode', 'paymentAmount', 'material', 'client', 'driverName', 'confirm'];
  currentStepIndex = 0;
  fieldErrors: Partial<Record<Step, string>> = {};

  siteId = 1;

  firstWeighType = FirstWeighType.Gross;

  vehicleSearch = '';
  vehicleSuggestions: Vehicle[] = [];
  vehicleHighlight = -1;
  selectedVehicle: Vehicle | null = null;

  vehicleType: VehicleType = VehicleType.Truck;

  charges = 0;
  paymentMode = PaymentMode.Cash;
  paymentAmount = 0;

  materialSearch = '';
  materialSuggestions: Material[] = [];
  materialHighlight = -1;
  selectedMaterial: Material | null = null;

  clientSearch = '';
  clientSuggestions: Client[] = [];
  clientHighlight = -1;
  selectedClient: Client | null = null;

  driverName = '';

  liveWeight: WeightReadingDto | null = null;
  weightState: ConnectionState = 'disconnected';
  captureVehicleImage = true;
  captureOperatorImage = false;

  saving = false;
  error = '';
  result: FirstWeighmentResponse | null = null;
  showPrint = false;
  printCount = 0;

  VehicleType = VehicleType;
  FirstWeighType = FirstWeighType;
  PaymentMode = PaymentMode;
  vehicleTypeEntries = Object.entries(VehicleType).filter(([, v]) => typeof v === 'number') as [string, number][];

  private vehicleSearch$ = new Subject<string>();
  private clientSearch$ = new Subject<string>();
  private materialSearch$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
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
    this.subs.add(
      this.realtimeWeight.weight$.subscribe(w => { this.liveWeight = w; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.realtimeWeight.connectionState$.subscribe(s => { this.weightState = s; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.vehicleSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchVehicles(q))
      ).subscribe(r => { this.vehicleSuggestions = r; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.clientSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchClients(q))
      ).subscribe(r => { this.clientSuggestions = r; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.materialSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchMaterials(q))
      ).subscribe(r => { this.materialSuggestions = r; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') {
          if (this.showPrint) { this.showPrint = false; return; }
          this.router.navigate(['/dashboard']);
        }
        if (key === 'F2') this.router.navigate(['/weighment/second']);
      })
    );
    setTimeout(() => this.focusStep('weighType'), 100);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private focusStep(step: Step): void {
    setTimeout(() => {
      const el = document.getElementById(`fld-${step}`) as HTMLElement | null;
      el?.focus();
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

  navigateDown(): void {
    if (this.vehicleSuggestions.length) {
      this.vehicleHighlight = Math.min(this.vehicleHighlight + 1, this.vehicleSuggestions.length - 1);
      this.cdr.markForCheck(); return;
    }
    if (this.materialSuggestions.length) {
      this.materialHighlight = Math.min(this.materialHighlight + 1, this.materialSuggestions.length - 1);
      this.cdr.markForCheck(); return;
    }
    if (this.clientSuggestions.length) {
      this.clientHighlight = Math.min(this.clientHighlight + 1, this.clientSuggestions.length - 1);
      this.cdr.markForCheck(); return;
    }
    this.advance(this.currentStep);
  }

  navigateUp(): void {
    if (this.vehicleSuggestions.length) {
      this.vehicleHighlight = Math.max(this.vehicleHighlight - 1, -1);
      this.cdr.markForCheck(); return;
    }
    if (this.materialSuggestions.length) {
      this.materialHighlight = Math.max(this.materialHighlight - 1, -1);
      this.cdr.markForCheck(); return;
    }
    if (this.clientSuggestions.length) {
      this.clientHighlight = Math.max(this.clientHighlight - 1, -1);
      this.cdr.markForCheck(); return;
    }
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.focusStep(this.currentStep);
      this.cdr.markForCheck();
    }
  }

  private validateStep(step: Step): string {
    if (step === 'vehicle' && !this.vehicleSearch.trim()) return 'Vehicle number is required.';
    return '';
  }

  // ─── Weight type ──────────────────────────────────────────────────────────────

  setWeighType(t: FirstWeighType): void {
    this.firstWeighType = t;
    this.advance('weighType');
  }

  onWeighTypeKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.firstWeighType = this.firstWeighType === FirstWeighType.Gross ? FirstWeighType.Tare : FirstWeighType.Gross;
      this.cdr.markForCheck();
    } else if (e.key.toLowerCase() === 'g') { e.preventDefault(); this.setWeighType(FirstWeighType.Gross); }
    else if (e.key.toLowerCase() === 't') { e.preventDefault(); this.setWeighType(FirstWeighType.Tare); }
    else if (e.key === 'Enter') this.advance('weighType');
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateDown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateUp(); }
  }

  // ─── Vehicle ──────────────────────────────────────────────────────────────────

  onVehicleInput(val: string): void {
    const upper = val.toUpperCase();
    const el = document.getElementById('fld-vehicle') as HTMLInputElement | null;
    if (el && el.value !== upper) { el.value = upper; }
    this.vehicleSearch = upper;
    this.vehicleHighlight = -1;
    this.selectedVehicle = null;
    if (upper.length >= 2) this.vehicleSearch$.next(upper);
    else this.vehicleSuggestions = [];
  }

  selectVehicle(v: Vehicle): void {
    this.selectedVehicle = v;
    this.vehicleSearch = v.licensePlate;
    this.vehicleSuggestions = [];
    this.vehicleHighlight = -1;
    this.vehicleType = v.type;
    if (v.defaultCharge != null) { this.charges = v.defaultCharge; this.paymentAmount = v.defaultCharge; }
    this.advance('vehicle');
  }

  onVehicleEnter(): void {
    if (this.vehicleSuggestions.length > 0) {
      const idx = this.vehicleHighlight >= 0 ? this.vehicleHighlight : 0;
      this.selectVehicle(this.vehicleSuggestions[idx]);
      return;
    }
    this.advance('vehicle');
  }

  // ─── Vehicle type ─────────────────────────────────────────────────────────────

  setVehicleType(t: number): void {
    this.vehicleType = t as VehicleType;
    this.advance('vehicleType');
  }

  onVehicleTypeKey(e: KeyboardEvent): void {
    const idx = this.vehicleTypeEntries.findIndex(([, v]) => v === this.vehicleType);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.vehicleType = this.vehicleTypeEntries[(idx + 1) % this.vehicleTypeEntries.length][1] as VehicleType;
      this.cdr.markForCheck();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.vehicleType = this.vehicleTypeEntries[(idx - 1 + this.vehicleTypeEntries.length) % this.vehicleTypeEntries.length][1] as VehicleType;
      this.cdr.markForCheck();
    } else if (e.key === 'Enter') {
      this.advance('vehicleType');
    } else if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateDown(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateUp(); }
  }

  // ─── Charges ──────────────────────────────────────────────────────────────────

  onChargesEnter(): void {
    this.paymentAmount = this.charges;
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

  // ─── Autocomplete helpers ─────────────────────────────────────────────────────

  onMaterialInput(val: string): void {
    this.materialSearch = val;
    this.materialHighlight = -1;
    this.selectedMaterial = null;
    if (val.length >= 2) this.materialSearch$.next(val);
    else this.materialSuggestions = [];
  }

  selectMaterial(m: Material): void {
    this.selectedMaterial = m;
    this.materialSearch = m.name;
    this.materialSuggestions = [];
    this.materialHighlight = -1;
    this.advance('material');
  }

  onMaterialEnter(): void {
    if (this.materialSuggestions.length > 0) {
      const idx = this.materialHighlight >= 0 ? this.materialHighlight : 0;
      this.selectMaterial(this.materialSuggestions[idx]);
      return;
    }
    this.advance('material');
  }

  onClientInput(val: string): void {
    this.clientSearch = val;
    this.clientHighlight = -1;
    this.selectedClient = null;
    if (val.length >= 2) this.clientSearch$.next(val);
    else this.clientSuggestions = [];
  }

  selectClient(c: Client): void {
    this.selectedClient = c;
    this.clientSearch = c.name;
    this.clientSuggestions = [];
    this.clientHighlight = -1;
    this.advance('client');
  }

  onClientEnter(): void {
    if (this.clientSuggestions.length > 0) {
      const idx = this.clientHighlight >= 0 ? this.clientHighlight : 0;
      this.selectClient(this.clientSuggestions[idx]);
      return;
    }
    this.advance('client');
  }

  // ─── Save & Print ─────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving) return;
    this.error = '';
    this.saving = true;
    this.cdr.markForCheck();

    const req: FirstWeighmentRequest = {
      siteId: this.siteId,
      vehicleLicensePlate: this.selectedVehicle?.licensePlate ?? this.vehicleSearch.trim().toUpperCase(),
      clientId: this.selectedClient?.id ?? null,
      materialId: this.selectedMaterial?.id ?? null,
      driverName: this.driverName,
      firstWeight: this.liveWeight?.weightKg ?? 0,
      firstWeighType: this.firstWeighType,
      totalCharges: this.charges,
      amountPaid: this.paymentAmount,
      paymentMode: this.paymentMode,
      captureVehicleImage: this.captureVehicleImage,
      captureOperatorImage: this.captureOperatorImage
    };

    this.api.firstWeighment(req)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          this.result = res;
          this.showPrint = true;
          this.printCount = 0;
          this.cdr.markForCheck();
          setTimeout(() => (document.getElementById('print-btn') as HTMLElement)?.focus(), 60);
        },
        error: err => {
          this.error = err?.error?.message || err?.error?.title || 'Save failed.';
          this.cdr.markForCheck();
        }
      });
  }

  doPrint(): void {
    this.printCount++;
    this.cdr.markForCheck();
    window.print();
  }

  newEntry(): void {
    this.currentStepIndex = 0;
    this.fieldErrors = {};
    this.firstWeighType = FirstWeighType.Gross;
    this.vehicleSearch = ''; this.vehicleSuggestions = []; this.selectedVehicle = null;
    this.vehicleType = VehicleType.Truck;
    this.charges = 0; this.paymentMode = PaymentMode.Cash; this.paymentAmount = 0;
    this.materialSearch = ''; this.materialSuggestions = []; this.selectedMaterial = null;
    this.clientSearch = ''; this.clientSuggestions = []; this.selectedClient = null;
    this.driverName = '';
    this.saving = false; this.error = ''; this.result = null;
    this.showPrint = false; this.printCount = 0;
    this.cdr.markForCheck();
    this.focusStep('weighType');
  }

  payModeName(m: PaymentMode): string {
    return m === PaymentMode.Cash ? 'Cash' : m === PaymentMode.Online ? 'Online' : 'Credit';
  }

  weighTypeName(t: FirstWeighType): string {
    return t === FirstWeighType.Gross ? 'Gross' : 'Tare';
  }

  vehicleTypeName(t: VehicleType): string {
    return VehicleType[t] ?? 'Unknown';
  }
}
