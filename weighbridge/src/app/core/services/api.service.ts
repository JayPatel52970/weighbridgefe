import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vehicle, Client, Material,
  FirstWeighmentRequest, FirstWeighmentResponse,
  PendingTicket, SecondWeighmentRequest, SecondWeighmentResponse,
  Rs232Settings, SiteInfo, SiteSettings, ChargeSlab, CameraSettings, AdminUser, CreateUserRequest,
  TodaysCollection, LedgerItem, AdminLedgerItem, WeighmentStatus,
  TicketDetailsDto, CreateOneGoWeighmentRequest, CreateOneGoWeighmentResult,
  VehicleTypeConfig, UpsertVehicleTypeRequest,
  PrinterSettings, UpsertPrinterSettingsRequest,
  UpsertClientRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  // ─── Auth ────────────────────────────────────────────────────────────────────
  // (handled by AuthService directly)

  // ─── Vehicles ─────────────────────────────────────────────────────────────
  searchVehicles(q: string): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/api/master/vehicles/search`, { params: { q } });
  }
  createVehicle(v: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.base}/api/master/vehicles`, v);
  }
  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/master/vehicles/${id}`);
  }

  // ─── Clients ──────────────────────────────────────────────────────────────
  listClients(skip = 0, take = 2000): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/api/master/clients`, { params: new HttpParams().set('skip', skip).set('take', take) });
  }
  searchClients(q: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/api/master/clients/search`, { params: { q } });
  }
  upsertClient(req: UpsertClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.base}/api/master/clients`, req);
  }
  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/master/clients/${id}`);
  }

  // ─── Materials ────────────────────────────────────────────────────────────
  searchMaterials(q: string): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.base}/api/master/materials/search`, { params: { q } });
  }
  createMaterial(m: Partial<Material>): Observable<Material> {
    return this.http.post<Material>(`${this.base}/api/master/materials`, m);
  }
  deleteMaterial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/master/materials/${id}`);
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────
  firstWeighment(req: FirstWeighmentRequest): Observable<FirstWeighmentResponse> {
    return this.http.post<FirstWeighmentResponse>(`${this.base}/api/tickets/first`, req);
  }
  getPendingTickets(siteId: number, search = ''): Observable<PendingTicket[]> {
    let params = new HttpParams().set('siteId', siteId);
    if (search) params = params.set('search', search);
    return this.http.get<PendingTicket[]>(`${this.base}/api/tickets/pending-second`, { params });
  }
  getTicketByNumber(ticketNumber: string, siteId: number): Observable<TicketDetailsDto> {
    return this.http.get<TicketDetailsDto>(`${this.base}/api/tickets/by-number/${encodeURIComponent(ticketNumber)}`, { params: { siteId } });
  }
  oneGoWeighment(req: CreateOneGoWeighmentRequest): Observable<CreateOneGoWeighmentResult> {
    return this.http.post<CreateOneGoWeighmentResult>(`${this.base}/api/tickets/one-go`, req);
  }
  secondWeighment(siteId: number, req: SecondWeighmentRequest): Observable<SecondWeighmentResponse> {
    return this.http.post<SecondWeighmentResponse>(`${this.base}/api/tickets/second`, req, {
      params: { siteId }
    });
  }

  // ─── RS232 Settings ───────────────────────────────────────────────────────
  getRs232Settings(siteId: number): Observable<Rs232Settings> {
    return this.http.get<Rs232Settings>(`${this.base}/api/admin/rs232`, { params: { siteId } });
  }
  saveRs232Settings(s: Rs232Settings): Observable<void> {
    return this.http.post<void>(`${this.base}/api/admin/rs232`, s);
  }

  // ─── Site Info ────────────────────────────────────────────────────────────
  getSiteInfo(siteId: number): Observable<SiteInfo> {
    return this.http.get<SiteInfo>(`${this.base}/api/admin/site`, { params: { siteId } });
  }
  saveSiteInfo(info: SiteInfo): Observable<void> {
    return this.http.post<void>(`${this.base}/api/admin/site`, info);
  }

  // ─── Admin Settings ───────────────────────────────────────────────────────
  getSettings(siteId: number): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(`${this.base}/api/admin/settings`, { params: { siteId } });
  }
  saveSettings(s: SiteSettings): Observable<SiteSettings> {
    return this.http.post<SiteSettings>(`${this.base}/api/admin/settings`, s);
  }

  // ─── Charge Slabs ─────────────────────────────────────────────────────────
  getChargeSlabs(siteId: number): Observable<ChargeSlab[]> {
    return this.http.get<ChargeSlab[]>(`${this.base}/api/admin/chargeslabs`, { params: { siteId } });
  }
  saveChargeSlab(s: ChargeSlab): Observable<ChargeSlab> {
    return this.http.post<ChargeSlab>(`${this.base}/api/admin/chargeslabs`, s);
  }
  deleteChargeSlab(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/chargeslabs/${id}`);
  }

  // ─── Cameras ──────────────────────────────────────────────────────────────
  getCameras(siteId: number): Observable<CameraSettings[]> {
    return this.http.get<CameraSettings[]>(`${this.base}/api/admin/cameras`, { params: { siteId } });
  }
  saveCamera(c: CameraSettings): Observable<CameraSettings> {
    return this.http.post<CameraSettings>(`${this.base}/api/admin/cameras`, c);
  }
  deleteCamera(siteId: number, kind: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/cameras`, { params: { siteId, kind } });
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/api/admin/users`);
  }
  createUser(req: CreateUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.base}/api/admin/users`, req);
  }
  disableUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/api/admin/users/${id}/disable`, {});
  }
  enableUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/api/admin/users/${id}/enable`, {});
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/users/${id}`);
  }

  // ─── Reports (User) ───────────────────────────────────────────────────────
  getTodaysCollection(siteId: number, date?: string): Observable<TodaysCollection> {
    let params = new HttpParams().set('siteId', siteId);
    if (date) params = params.set('date', date);
    return this.http.get<TodaysCollection>(`${this.base}/api/reports/todays-collection`, { params });
  }
  getLedger(siteId: number, f: { from?: string; to?: string; search?: string; status?: WeighmentStatus; skip?: number; take?: number } = {}): Observable<LedgerItem[]> {
    let params = new HttpParams().set('siteId', siteId);
    if (f.from) params = params.set('from', f.from);
    if (f.to) params = params.set('to', f.to);
    if (f.search) params = params.set('search', f.search);
    if (f.status != null) params = params.set('status', f.status);
    if (f.skip != null) params = params.set('skip', f.skip);
    if (f.take != null) params = params.set('take', f.take);
    return this.http.get<LedgerItem[]>(`${this.base}/api/reports/ledger`, { params });
  }
  getVehicleReport(siteId: number, f: { vehicleId?: string; licensePlate?: string; from?: string; to?: string; skip?: number; take?: number } = {}): Observable<LedgerItem[]> {
    let params = new HttpParams().set('siteId', siteId);
    if (f.vehicleId) params = params.set('vehicleId', f.vehicleId);
    if (f.licensePlate) params = params.set('licensePlate', f.licensePlate);
    if (f.from) params = params.set('from', f.from);
    if (f.to) params = params.set('to', f.to);
    if (f.skip != null) params = params.set('skip', f.skip);
    if (f.take != null) params = params.set('take', f.take);
    return this.http.get<LedgerItem[]>(`${this.base}/api/reports/vehicle`, { params });
  }

  // ─── Reports (Admin) ──────────────────────────────────────────────────────
  getAdminTodaysCollection(siteId: number, date?: string, createdBy?: string): Observable<TodaysCollection> {
    let params = new HttpParams().set('siteId', siteId);
    if (date) params = params.set('date', date);
    if (createdBy) params = params.set('createdBy', createdBy);
    return this.http.get<TodaysCollection>(`${this.base}/api/admin/reports/todays-collection`, { params });
  }
  getAdminLedger(siteId: number, f: { from?: string; to?: string; search?: string; status?: WeighmentStatus; createdBy?: string; skip?: number; take?: number } = {}): Observable<AdminLedgerItem[]> {
    let params = new HttpParams().set('siteId', siteId);
    if (f.from) params = params.set('from', f.from);
    if (f.to) params = params.set('to', f.to);
    if (f.search) params = params.set('search', f.search);
    if (f.status != null) params = params.set('status', f.status);
    if (f.createdBy) params = params.set('createdBy', f.createdBy);
    if (f.skip != null) params = params.set('skip', f.skip);
    if (f.take != null) params = params.set('take', f.take);
    return this.http.get<AdminLedgerItem[]>(`${this.base}/api/admin/reports/ledger`, { params });
  }
  getAdminVehicleReport(siteId: number, f: { vehicleId?: string; licensePlate?: string; from?: string; to?: string; createdBy?: string; skip?: number; take?: number } = {}): Observable<AdminLedgerItem[]> {
    let params = new HttpParams().set('siteId', siteId);
    if (f.vehicleId) params = params.set('vehicleId', f.vehicleId);
    if (f.licensePlate) params = params.set('licensePlate', f.licensePlate);
    if (f.from) params = params.set('from', f.from);
    if (f.to) params = params.set('to', f.to);
    if (f.createdBy) params = params.set('createdBy', f.createdBy);
    if (f.skip != null) params = params.set('skip', f.skip);
    if (f.take != null) params = params.set('take', f.take);
    return this.http.get<AdminLedgerItem[]>(`${this.base}/api/admin/reports/vehicle`, { params });
  }

  // ─── Vehicle Type Config ──────────────────────────────────────────────────
  getVehicleTypes(siteId: number): Observable<VehicleTypeConfig[]> {
    return this.http.get<VehicleTypeConfig[]>(`${this.base}/api/admin/vehicletypes`, { params: { siteId } });
  }
  upsertVehicleType(req: UpsertVehicleTypeRequest, imageFile?: File | null): Observable<void> {
    const fd = new FormData();
    if (req.id) fd.append('Id', req.id);
    fd.append('SiteId', String(req.siteId));
    fd.append('Code', req.code);
    fd.append('DisplayName', req.displayName);
    fd.append('Price', String(req.price));
    if (imageFile) fd.append('Image', imageFile);
    if (req.existingImageUrl) fd.append('ExistingImageUrl', req.existingImageUrl);
    return this.http.post<void>(`${this.base}/api/admin/vehicletypes`, fd);
  }
  deleteVehicleType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/admin/vehicletypes/${id}`);
  }

  // ─── Printer Settings ──────────────────────────────────────────────────────
  getPrinterSettings(siteId: number): Observable<PrinterSettings> {
    return this.http.get<PrinterSettings>(`${this.base}/api/admin/printersettings`, { params: { siteId } });
  }
  getPrintFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/api/admin/printersettings/formats`);
  }
  upsertPrinterSettings(req: UpsertPrinterSettingsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/api/admin/printersettings`, req);
  }
  sendToPrinter(siteId: number, ticketId: string, format?: string): Observable<void> {
    let params = new HttpParams().set('siteId', siteId);
    if (format) params = params.set('format', format);
    return this.http.post<void>(`${this.base}/api/print/ticket/${encodeURIComponent(ticketId)}/send`, {}, { params });
  }
  printTicketByNumber(siteId: number, ticketNumber: string, format?: string): Observable<Blob> {
    let params = new HttpParams().set('siteId', siteId);
    if (format) params = params.set('format', format);
    return this.http.get(`${this.base}/api/print/ticket/by-number/${encodeURIComponent(ticketNumber)}`, { params, responseType: 'blob' });
  }
  sendToPrinterByNumber(siteId: number, ticketNumber: string, format?: string): Observable<void> {
    let params = new HttpParams().set('siteId', siteId);
    if (format) params = params.set('format', format);
    return this.http.post<void>(`${this.base}/api/print/ticket/by-number/${encodeURIComponent(ticketNumber)}/send`, {}, { params });
  }

}
