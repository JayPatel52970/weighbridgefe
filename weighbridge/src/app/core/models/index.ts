// ─── Enums ───────────────────────────────────────────────────────────────────

export enum VehicleType {
  Unknown = 0,
  Truck = 1,
  Trailer = 2,
  Tractor = 3,
  Pickup = 4,
  Other = 99
}

export enum FirstWeighType {
  Gross = 0,
  Tare = 1
}

export enum PaymentMode {
  Cash = 0,
  Online = 1,
  Credit = 2
}

export enum CameraKind {
  Vehicle = 1,
  Operator = 2
}

export enum CameraProtocol {
  HttpSnapshot = 1,
  RtspSnapshot = 2
}

export enum ChargeSuggestionBasis {
  None = 0,
  VehicleRegisteredTareWeight = 1,
  CapturedTareWeight = 2
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  username: string;
  roles: string[];
}

export interface SavedProfile {
  username: string;
  accessToken: string;
  roles: string[];
  lastLoginAt: string;
  exp?: number;
}

// ─── Master ───────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  licensePlate: string;
  registeredTareWeight?: number;
  type: VehicleType;
  defaultCharge?: number;
  typeImageUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  isSendHalfTicketOnWhatsApp?: boolean;
  isSendFullTicketOnWhatsApp?: boolean;
  allowPrintBeforeFullPayment?: boolean;
}

export interface Material {
  id: string;
  name: string;
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface FirstWeighmentRequest {
  siteId: number;
  vehicleLicensePlate: string;
  clientId?: string | null;
  materialId?: string | null;
  driverName?: string;
  firstWeight: number;
  firstWeighType: FirstWeighType;
  totalCharges: number;
  amountPaid: number;
  paymentMode: PaymentMode;
  captureVehicleImage: boolean;
  captureOperatorImage: boolean;
}

export interface FirstWeighmentResponse {
  ticketId: string;
  ticketNumber: string;
  serialNumber: number;
  suggestedCharges: number;
  totalCharges: number;
  amountPaid: number;
  paymentStatus: string;
}

export interface PendingTicket {
  ticketId: string;
  serialNumber: number;
  ticketNumber: string;
  vehicleLicensePlate: string;
  clientName?: string;
  driverName?: string;
  totalCharges: number;
  firstWeightDateTime: string;
  firstWeight: number;
}

export interface SecondWeighmentRequest {
  ticketId: string;
  secondWeight: number;
  totalCharges: number;
  amountPaid: number;
  captureVehicleImage: boolean;
  captureOperatorImage: boolean;
  printRequested: boolean;
}

export interface SecondWeighmentResponse {
  ticketId: string;
  ticketNumber: string;
  netWeight: number;
  suggestedCharges: number;
  totalCharges: number;
  amountPaid: number;
  paymentStatus: string;
  printAllowed: boolean;
  printBlockedReason?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface SiteSettings {
  siteId: number;
  ticketPrefix?: string;
  ticketPostfix?: string;
  enableChargeSuggestion: boolean;
  chargeSuggestionBasis: ChargeSuggestionBasis;
  recalculateSuggestedChargesOnSecondWeighment: boolean;
  blockPrintIfPaymentPending: boolean;
}

export interface ChargeSlab {
  id?: string | null;
  siteId: number;
  fromWeight: number;
  toWeight: number;
  chargeAmount: number;
}

export interface CameraSettings {
  id?: string;
  siteId: number;
  kind: CameraKind;
  enabled: boolean;
  protocol: CameraProtocol;
  url?: string;
  username?: string;
  password?: string;
  snapshotPath?: string;
  timeoutSeconds?: number;
  storageFolder?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  roles: string[];
  isDisabled: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roles: string[];
}
