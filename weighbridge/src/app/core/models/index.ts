// ─── Enums ───────────────────────────────────────────────────────────────────

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

export enum WeighmentStatus {
  PendingSecondWeight = 0,
  Completed = 1,
  Cancelled = 2
}

export enum PaymentStatus {
  Pending = 0,
  PartiallyPaid = 1,
  Paid = 2
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
  vehicleTypeId: string | null;
  defaultCharge?: number;
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

export interface SiteInfo {
  siteId: number;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  district?: string;
  state?: string;
  country?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  otherInformation?: string;
}

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

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface TodaysCollection {
  date: string;
  ticketCount: number;
  completedCount: number;
  pendingSecondCount: number;
  totalCharges: number;
  amountPaid: number;
  pendingAmount: number;
}

export interface LedgerItem {
  ticketId: string;
  siteId: number;
  serialNumber: number;
  ticketNumber: string;
  vehicleLicensePlate: string;
  clientName: string | null;
  materialName: string | null;
  driverName: string;
  firstWeight: number;
  firstWeighType: FirstWeighType;
  firstWeightDateTime: string;
  secondWeight: number | null;
  secondWeightDateTime: string | null;
  netWeight: number | null;
  status: WeighmentStatus;
  totalCharges: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
}

export interface AdminLedgerItem extends LedgerItem {
  createdBy: string;
}

// ─── Ticket Details ───────────────────────────────────────────────────────────

export interface TicketDetailsDto {
  ticketId: string;
  siteId: number;
  serialNumber: number;
  ticketNumber: string;

  vehicleLicensePlate: string;
  vehicleTypeId: string | null;
  vehicleTypeCode: string | null;
  vehicleTypeDisplayName: string | null;
  vehicleTypePrice: number | null;
  vehicleRegisteredTareWeight: number | null;

  clientId: string | null;
  clientName: string | null;

  materialId: string | null;
  materialName: string | null;

  driverName: string;

  firstWeight: number;
  firstWeighType: FirstWeighType;
  firstWeightDateTime: string;
  firstWeightVehicleImageUrl: string;
  firstWeightOperatorImageUrl: string;

  secondWeight: number | null;
  secondWeightDateTime: string | null;
  secondWeightVehicleImageUrl: string;
  secondWeightOperatorImageUrl: string;

  netWeight: number | null;
  grossWeight: number | null;
  tareWeight: number | null;

  status: WeighmentStatus;

  isChargeSuggestionEnabled: boolean;
  suggestedCharges: number | null;

  totalCharges: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMode: PaymentMode;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string | null;
}

// ─── One-Go ───────────────────────────────────────────────────────────────────

export interface CreateOneGoWeighmentRequest {
  siteId: number;
  vehicleLicensePlate: string;
  clientId?: string | null;
  materialId?: string | null;
  driverName?: string;
  grossWeight: number;
  knownTareWeight: number;
  totalCharges?: number | null;
  amountPaid: number;
  paymentMode: PaymentMode;
  captureVehicleImage: boolean;
  captureOperatorImage: boolean;
  printRequested: boolean;
}

export interface CreateOneGoWeighmentResult {
  ticketId: string;
  ticketNumber: string;
  serialNumber: number;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  suggestedCharges: number;
  totalCharges: number;
  amountPaid: number;
  paymentStatus: string;
  printAllowed: boolean;
  printBlockedReason?: string;
}

// ─── Vehicle Type Config (Admin) ──────────────────────────────────────────────

export interface VehicleTypeConfig {
  id: string;
  siteId: number;
  code: string;
  displayName: string;
  price: number;
  imageUrl?: string | null;
}

export interface UpsertVehicleTypeRequest {
  id?: string | null;
  siteId: number;
  code: string;
  displayName: string;
  price: number;
  existingImageUrl?: string | null;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export interface WeightReadingDto {
  siteId: number;
  weightKg: number;
  raw: string;
  isStable: boolean;
  mode?: string;
  timestamp?: string;
}
