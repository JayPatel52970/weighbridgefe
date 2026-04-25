import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vehicle, Client, Material,
  FirstWeighmentRequest, FirstWeighmentResponse,
  PendingTicket, SecondWeighmentRequest, SecondWeighmentResponse,
  SiteSettings, ChargeSlab, CameraSettings, AdminUser, CreateUserRequest
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
  uploadVehicleTypeImage(id: string, file: File): Observable<Vehicle> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<Vehicle>(`${this.base}/api/master/vehicles/${id}/type-image`, fd);
  }

  // ─── Clients ──────────────────────────────────────────────────────────────
  searchClients(q: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/api/master/clients/search`, { params: { q } });
  }
  createClient(c: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(`${this.base}/api/master/clients`, c);
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
  secondWeighment(siteId: number, req: SecondWeighmentRequest): Observable<SecondWeighmentResponse> {
    return this.http.post<SecondWeighmentResponse>(`${this.base}/api/tickets/second`, req, {
      params: { siteId }
    });
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

  // ─── Uploads ──────────────────────────────────────────────────────────────
  uploadVehicleTypeGenericImage(file: File, vehicleType: string, siteId?: number): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('VehicleType', vehicleType);
    if (siteId != null) fd.append('SiteId', String(siteId));
    return this.http.post(`${this.base}/api/admin/uploads/vehicle-type-image`, fd, { responseType: 'text' });
  }
}
