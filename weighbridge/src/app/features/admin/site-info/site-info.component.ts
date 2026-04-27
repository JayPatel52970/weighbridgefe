import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SiteInfo } from '../../../core/models';

@Component({
  selector: 'app-site-info',
  templateUrl: './site-info.component.html',
  standalone: false
})
export class SiteInfoComponent implements OnInit {
  siteId = 1;
  info: SiteInfo = { siteId: 1 };
  loading = false;
  saving = false;
  success = false;
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getSiteInfo(this.siteId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.info = r; this.cdr.markForCheck(); },
        error: err => {
          if (err.status === 404) {
            this.info = { siteId: this.siteId };
          }
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  save(): void {
    this.error = '';
    this.success = false;
    this.saving = true;
    this.cdr.markForCheck();
    this.api.saveSiteInfo({ ...this.info, siteId: this.siteId })
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.success = true; this.cdr.markForCheck(); },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }
}
