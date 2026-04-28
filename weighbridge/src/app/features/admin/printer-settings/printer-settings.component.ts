import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  PrinterSettings, UpsertPrinterSettingsRequest,
  PrinterType, PrinterConnectedOsType, PrinterOrientation
} from '../../../core/models';

@Component({
  selector: 'app-printer-settings',
  templateUrl: './printer-settings.component.html',
  standalone: false,
  styles: [`
    .tp-back { position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:1055; display:flex; align-items:center; justify-content:center; }
    .tp-card { background:#fff; border-radius:12px; width:480px; max-width:92vw; box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden; }
    .tp-head { background:linear-gradient(135deg,#0d6efd 0%,#0943a3 100%); color:#fff; padding:16px 20px; }
    .tp-body { padding:20px; }
    .tp-foot { padding:14px 20px; background:#f9fafb; display:flex; gap:8px; justify-content:flex-end; border-top:1px solid #e5e7eb; }
  `]
})
export class PrinterSettingsComponent implements OnInit {
  siteId = 1;

  settings: UpsertPrinterSettingsRequest = {
    siteId: 1,
    enabled: true,
    printerType: PrinterType.DotMatrix,
    connectedOsType: PrinterConnectedOsType.Arm,
    printerName: '',
    defaultPrintFormat: '',
    paperWidth: 40,
    linesPerPage: 60,
    topMargin: 0,
    bottomMargin: 3,
    isCondensed: false,
    isDoubleWidth: false,
    paperSize: 'A4',
    orientation: PrinterOrientation.Portrait,
    margin: 10
  };

  formats: string[] = [];
  loading = false;
  saving = false;
  success = false;
  error = '';

  showTestPrint = false;
  testTicketId = '';
  testFormat = '';
  testPrinting = false;
  testError = '';
  testSuccess = false;

  readonly PrinterType = PrinterType;

  readonly printerTypeOptions = [
    { value: PrinterType.Laser,     label: 'Laser' },
    { value: PrinterType.DotMatrix, label: 'Dot Matrix' }
  ];
  readonly osTypeOptions = [
    { value: PrinterConnectedOsType.Windows64, label: 'Windows 64-bit' },
    { value: PrinterConnectedOsType.Windows32, label: 'Windows 32-bit' },
    { value: PrinterConnectedOsType.Linux64,   label: 'Linux 64-bit' },
    { value: PrinterConnectedOsType.Linux32,   label: 'Linux 32-bit' },
    { value: PrinterConnectedOsType.Arm,       label: 'ARM (Raspberry Pi)' }
  ];
  readonly orientationOptions = [
    { value: PrinterOrientation.Portrait,  label: 'Portrait' },
    { value: PrinterOrientation.Landscape, label: 'Landscape' }
  ];
  readonly paperSizeOptions = ['A4', 'A5', 'Letter', 'Legal'];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.getPrintFormats().subscribe({
      next: formats => { this.formats = formats; this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck()
    });

    this.api.getPrinterSettings(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (s: PrinterSettings) => {
          this.settings = {
            siteId: s.siteId,
            enabled: s.enabled,
            printerType: s.printerType,
            connectedOsType: s.connectedOsType,
            printerName: s.printerName,
            defaultPrintFormat: s.defaultPrintFormat,
            paperWidth: s.paperWidth,
            linesPerPage: s.linesPerPage,
            topMargin: s.topMargin,
            bottomMargin: s.bottomMargin,
            isCondensed: s.isCondensed,
            isDoubleWidth: s.isDoubleWidth,
            paperSize: s.paperSize,
            orientation: s.orientation,
            margin: s.margin
          };
          this.cdr.markForCheck();
        },
        error: err => {
          if (err.status !== 404) this.error = 'Failed to load settings.';
          this.cdr.markForCheck();
        }
      });
  }

  reload(): void {
    this.success = false;
    this.loadAll();
  }

  save(): void {
    const validationError = this.validate();
    if (validationError) { this.error = validationError; return; }
    this.error = '';
    this.success = false;
    this.saving = true;
    this.cdr.markForCheck();
    this.api.upsertPrinterSettings({ ...this.settings, siteId: this.siteId })
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.success = true; this.cdr.markForCheck(); },
        error: e => { this.error = e?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  private validate(): string {
    if (this.settings.enabled) {
      if (!this.settings.printerName?.trim()) return 'Printer name is required when enabled.';
      if (!this.settings.defaultPrintFormat)  return 'Default print format is required when enabled.';
    }
    if (this.settings.printerType === PrinterType.DotMatrix) {
      if (this.settings.paperWidth <= 0)    return 'Paper width must be greater than 0.';
      if (this.settings.linesPerPage <= 0)  return 'Lines per page must be greater than 0.';
      if (this.settings.topMargin < 0)      return 'Top margin must be 0 or greater.';
      if (this.settings.bottomMargin < 0)   return 'Bottom margin must be 0 or greater.';
    }
    if (this.settings.printerType === PrinterType.Laser) {
      if (!this.settings.paperSize?.trim()) return 'Paper size is required.';
      if (this.settings.margin < 0)         return 'Margin must be 0 or greater.';
    }
    return '';
  }

  openTestPrint(): void {
    this.testTicketId = '';
    this.testFormat = '';
    this.testError = '';
    this.testSuccess = false;
    this.showTestPrint = true;
    setTimeout(() => (document.getElementById('test-ticket-id') as HTMLElement)?.focus(), 60);
  }

  closeTestPrint(): void { this.showTestPrint = false; }

  sendTestPrint(): void {
    if (!this.testTicketId.trim()) { this.testError = 'Ticket number is required.'; return; }
    this.testError = '';
    this.testSuccess = false;
    this.testPrinting = true;
    this.cdr.markForCheck();
    this.api.sendToPrinterByNumber(this.siteId, this.testTicketId.trim(), this.testFormat || undefined)
      .pipe(finalize(() => { this.testPrinting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.testSuccess = true; this.cdr.markForCheck(); },
        error: e => { this.testError = e?.error?.message || 'Print failed. Check server logs.'; this.cdr.markForCheck(); }
      });
  }
}
