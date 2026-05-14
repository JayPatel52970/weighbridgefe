import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { KeyboardService } from '../../core/services/keyboard.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { RealtimeWeightService, ConnectionState } from '../../core/realtime/realtime-weight.service';
import { WeightReadingDto } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  liveWeight: WeightReadingDto | null = null;
  weightState: ConnectionState = 'disconnected';
  zeroing = false;
  zeroMsg = '';

  private subs = new Subscription();

  constructor(
    private kb: KeyboardService,
    private router: Router,
    public auth: AuthService,
    private api: ApiService,
    private realtimeWeight: RealtimeWeightService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.realtimeWeight.weight$.subscribe(w => { this.liveWeight = w; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.realtimeWeight.connectionState$.subscribe(s => { this.weightState = s; this.cdr.markForCheck(); })
    );
    this.subs.add(
      this.kb.shortcuts$.subscribe(key => {
        if (key === 'F1') this.router.navigate(['/weighment/first']);
        if (key === 'F2') this.router.navigate(['/weighment/second-direct']);
        if (key === 'F3') this.router.navigate(['/weighment/second']);
        if (key === 'F4') this.router.navigate(['/weighment/print-duplicate']);
        if (key === 'F5') this.router.navigate(['/weighment/one-go']);
      })
    );
  }

  zeroScale(): void {
    this.zeroing = true;
    this.zeroMsg = '';
    this.cdr.markForCheck();
    this.api.zeroScale()
      .pipe(finalize(() => { this.zeroing = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => { this.zeroMsg = r.status === 'ok' ? 'Zeroed' : (r.message ?? 'Failed'); this.cdr.markForCheck(); },
        error: () => { this.zeroMsg = 'Failed'; this.cdr.markForCheck(); }
      });
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
