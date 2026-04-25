import { Component, OnInit } from '@angular/core';
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

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getSettings(this.siteId).subscribe({
      next: s => { this.settings = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    this.error = '';
    this.success = false;
    this.saving = true;
    this.api.saveSettings(this.settings).subscribe({
      next: () => { this.saving = false; this.success = true; },
      error: err => { this.saving = false; this.error = err?.error?.message || 'Save failed.'; }
    });
  }
}
