import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import {
  Vehicle, Client, Material,
  FirstWeighmentRequest, FirstWeighmentResponse,
  VehicleType, FirstWeighType, PaymentMode
} from '../../../core/models';

@Component({
  selector: 'app-first-weighment',
  templateUrl: './first-weighment.component.html',
  standalone: false
})
export class FirstWeighmentComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleInput') vehicleInput!: ElementRef<HTMLInputElement>;

  siteId = 1;
  vehicleSearch = '';
  vehicleSuggestions: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  showAddVehicle = false;
  newVehiclePlate = '';
  newVehicleType = VehicleType.Truck;

  clientSearch = '';
  clientSuggestions: Client[] = [];
  selectedClient: Client | null = null;

  materialSearch = '';
  materialSuggestions: Material[] = [];
  selectedMaterial: Material | null = null;

  driverName = '';
  firstWeight: number | null = null;
  firstWeighType = FirstWeighType.Gross;
  totalCharges = 0;
  amountPaid = 0;
  paymentMode = PaymentMode.Cash;
  captureVehicleImage = true;
  captureOperatorImage = false;

  saving = false;
  error = '';
  result: FirstWeighmentResponse | null = null;

  VehicleType = VehicleType;
  FirstWeighType = FirstWeighType;
  PaymentMode = PaymentMode;
  vehicleTypes = Object.entries(VehicleType).filter(([, v]) => typeof v === 'number') as [string, number][];

  private vehicleSearch$ = new Subject<string>();
  private clientSearch$ = new Subject<string>();
  private materialSearch$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private kb: KeyboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.vehicleSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchVehicles(q))
      ).subscribe(r => this.vehicleSuggestions = r)
    );
    this.subs.add(
      this.clientSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchClients(q))
      ).subscribe(r => this.clientSuggestions = r)
    );
    this.subs.add(
      this.materialSearch$.pipe(debounceTime(250), distinctUntilChanged(),
        switchMap(q => this.api.searchMaterials(q))
      ).subscribe(r => this.materialSuggestions = r)
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'Escape') this.router.navigate(['/dashboard']);
        if (key === 'F2') this.router.navigate(['/weighment/second']);
      })
    );
    setTimeout(() => this.vehicleInput?.nativeElement?.focus(), 100);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  onVehicleType(val: string): void {
    this.vehicleSearch = val;
    if (val.length >= 2) this.vehicleSearch$.next(val);
    else this.vehicleSuggestions = [];
    this.selectedVehicle = null;
  }

  selectVehicle(v: Vehicle): void {
    this.selectedVehicle = v;
    this.vehicleSearch = v.licensePlate;
    this.vehicleSuggestions = [];
    if (v.defaultCharge) this.totalCharges = v.defaultCharge;
  }

  onClientType(val: string): void {
    this.clientSearch = val;
    if (val.length >= 2) this.clientSearch$.next(val);
    else this.clientSuggestions = [];
    this.selectedClient = null;
  }

  selectClient(c: Client): void {
    this.selectedClient = c;
    this.clientSearch = c.name;
    this.clientSuggestions = [];
  }

  onMaterialType(val: string): void {
    this.materialSearch = val;
    if (val.length >= 2) this.materialSearch$.next(val);
    else this.materialSuggestions = [];
    this.selectedMaterial = null;
  }

  selectMaterial(m: Material): void {
    this.selectedMaterial = m;
    this.materialSearch = m.name;
    this.materialSuggestions = [];
  }

  addVehicle(): void {
    if (!this.newVehiclePlate.trim()) return;
    this.api.createVehicle({ licensePlate: this.newVehiclePlate.toUpperCase(), type: this.newVehicleType })
      .subscribe(v => {
        this.selectVehicle(v);
        this.showAddVehicle = false;
        this.newVehiclePlate = '';
      });
  }

  save(): void {
    if (!this.selectedVehicle && !this.vehicleSearch.trim()) {
      this.error = 'Vehicle is required.';
      return;
    }
    if (!this.firstWeight || this.firstWeight <= 0) {
      this.error = 'Weight is required and must be greater than 0.';
      return;
    }
    this.error = '';
    this.saving = true;

    const req: FirstWeighmentRequest = {
      siteId: this.siteId,
      vehicleLicensePlate: this.selectedVehicle?.licensePlate ?? this.vehicleSearch.toUpperCase(),
      clientId: this.selectedClient?.id ?? null,
      materialId: this.selectedMaterial?.id ?? null,
      driverName: this.driverName,
      firstWeight: this.firstWeight,
      firstWeighType: this.firstWeighType,
      totalCharges: this.totalCharges,
      amountPaid: this.amountPaid,
      paymentMode: this.paymentMode,
      captureVehicleImage: this.captureVehicleImage,
      captureOperatorImage: this.captureOperatorImage
    };

    this.api.firstWeighment(req).subscribe({
      next: res => { this.saving = false; this.result = res; },
      error: err => {
        this.saving = false;
        this.error = err?.error?.message || err?.error?.title || 'Save failed.';
      }
    });
  }

  newEntry(): void {
    this.result = null;
    this.vehicleSearch = '';
    this.selectedVehicle = null;
    this.clientSearch = '';
    this.selectedClient = null;
    this.materialSearch = '';
    this.selectedMaterial = null;
    this.driverName = '';
    this.firstWeight = null;
    this.totalCharges = 0;
    this.amountPaid = 0;
    setTimeout(() => this.vehicleInput?.nativeElement?.focus(), 50);
  }
}
