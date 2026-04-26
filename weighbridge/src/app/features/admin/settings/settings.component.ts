import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SiteSettings, ChargeSuggestionBasis } from '../../../core/models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  standalone: false
})
export class SettingsComponent implements OnInit {
  siteId = 1;
  settings: SiteSettings = {
    siteId: 1,
    ticketPrefix: 'WB-',
    ticketPostfix: '-A',
    enableChargeSuggestion: true,
    chargeSuggestionBasis: ChargeSuggestionBasis.VehicleRegisteredTareWeight,
    recalculateSuggestedChargesOnSecondWeighment: true,
    blockPrintIfPaymentPending: true
  };
  loading = false;
  saving = false;
  success = false;
  error = '';

  ChargeSuggestionBasis = ChargeSuggestionBasis;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getSettings(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: s => { this.settings = s; this.cdr.markForCheck(); } });
  }

  save(): void {
    this.error = '';
    this.success = false;
    this.saving = true;
    this.cdr.markForCheck();
    this.api.saveSettings(this.settings)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.success = true; this.cdr.markForCheck(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }
}
