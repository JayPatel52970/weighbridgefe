import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Rs232Settings } from '../../../core/models';

@Component({
  selector: 'app-rs232',
  templateUrl: './rs232.component.html',
  standalone: false
})
export class Rs232Component implements OnInit {
  siteId = 1;

  settings: Rs232Settings = {
    siteId: 1,
    enabled: true,
    portName: '',
    baudRate: 9600,
    dataBits: 7,
    parity: 2,
    stopBits: 1,
    handshake: 0,
    readTimeoutMs: 1000,
    newLine: '\\r\\n',
    weightRegex: '(-?\\d+(?:\\.\\d+)?)',
    stableRegex: null,
    unitMultiplierToKg: 1
  };

  loading = false;
  saving = false;
  success = false;
  error = '';

  readonly baudRates = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
  readonly dataBitsOptions = [5, 6, 7, 8];
  readonly parityOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Odd' },
    { value: 2, label: 'Even' },
    { value: 3, label: 'Mark' },
    { value: 4, label: 'Space' }
  ];
  readonly stopBitsOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'One (1)' },
    { value: 2, label: 'Two (2)' },
    { value: 3, label: 'One Point Five (1.5)' }
  ];
  readonly handshakeOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'XOn / XOff' },
    { value: 2, label: 'Request To Send (RTS)' },
    { value: 3, label: 'RTS + XOn / XOff' }
  ];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getRs232Settings(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: s => { this.settings = s; this.cdr.markForCheck(); },
        error: err => {
          if (err.status === 404) this.settings = { ...this.settings, siteId: this.siteId };
          this.cdr.markForCheck();
        }
      });
  }

  save(): void {
    if (!this.settings.portName?.trim()) { this.error = 'Port name is required.'; return; }
    if (!this.settings.weightRegex?.trim()) { this.error = 'Weight regex is required.'; return; }
    this.error = '';
    this.success = false;
    this.saving = true;
    this.cdr.markForCheck();
    this.api.saveRs232Settings({ ...this.settings, siteId: this.siteId })
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.success = true; this.cdr.markForCheck(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }
}
