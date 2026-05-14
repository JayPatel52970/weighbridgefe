import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { finalize, interval, Subscription, switchMap, startWith } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IndicatorSettings, ScaleHealthResponse } from '../../../core/models';

@Component({
  selector: 'app-indicator-settings',
  templateUrl: './indicator-settings.component.html',
  standalone: false
})
export class IndicatorSettingsComponent implements OnInit, OnDestroy {
  private siteId = 1;
  private subs = new Subscription();

  settings: IndicatorSettings = {
    siteId: 1,
    serialPort: '/dev/serial0',
    baudRate: 9600,
    zeroKeyCombination: 'ALT+Z',
    writeTimeoutMs: 500,
    id: '',
    createdAt: '',
    isDeleted: false
  };

  baudRates = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

  loading = false;
  saving = false;
  success = '';
  error = '';

  health: ScaleHealthResponse | null = null;
  healthLoading = false;

  zeroing = false;
  zeroMsg = '';
  zeroError = '';

  customKeys = '';
  sendingKey = false;
  keyMsg = '';
  keyError = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.pollHealth();
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getIndicatorSettings(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: s => { this.settings = s; this.cdr.markForCheck(); },
        error: () => { /* keep defaults on 404 */ this.cdr.markForCheck(); }
      });
  }

  save(): void {
    if (!this.settings.serialPort?.trim()) { this.error = 'Serial port is required.'; return; }
    if (!this.settings.zeroKeyCombination?.trim()) { this.error = 'Zero key combination is required.'; return; }
    this.error = '';
    this.success = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.updateIndicatorSettings({
      siteId: this.siteId,
      serialPort: this.settings.serialPort,
      baudRate: this.settings.baudRate,
      zeroKeyCombination: this.settings.zeroKeyCombination,
      writeTimeoutMs: this.settings.writeTimeoutMs
    }).pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.success = 'Settings saved.'; this.cdr.markForCheck(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  zeroScale(): void {
    this.zeroing = true;
    this.zeroMsg = '';
    this.zeroError = '';
    this.cdr.markForCheck();
    this.api.zeroScale()
      .pipe(finalize(() => { this.zeroing = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.zeroMsg = r.status === 'ok' ? 'Scale zeroed successfully.' : (r.message ?? 'Failed.'); this.cdr.markForCheck(); },
        error: err => { this.zeroError = err?.error?.message || 'Failed to zero the scale.'; this.cdr.markForCheck(); }
      });
  }

  sendKey(): void {
    if (!this.customKeys.trim()) return;
    this.sendingKey = true;
    this.keyMsg = '';
    this.keyError = '';
    this.cdr.markForCheck();
    this.api.sendScaleKey(this.customKeys.trim())
      .pipe(finalize(() => { this.sendingKey = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.keyMsg = r.status === 'ok' ? `Sent: ${r.keys}` : (r.message ?? 'Failed.'); this.cdr.markForCheck(); },
        error: err => { this.keyError = err?.error?.message || 'Failed to send key.'; this.cdr.markForCheck(); }
      });
  }

  checkHealth(): void {
    this.healthLoading = true;
    this.cdr.markForCheck();
    this.api.getScaleHealth()
      .pipe(finalize(() => { this.healthLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: h => { this.health = h; this.cdr.markForCheck(); },
        error: () => { this.health = { status: 'offline', reason: 'Could not reach backend.' }; this.cdr.markForCheck(); }
      });
  }

  private pollHealth(): void {
    this.subs.add(
      interval(15000).pipe(startWith(0), switchMap(() => this.api.getScaleHealth()))
        .subscribe({
          next: h => { this.health = h; this.cdr.markForCheck(); },
          error: () => { this.health = { status: 'offline', reason: 'Could not reach backend.' }; this.cdr.markForCheck(); }
        })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
