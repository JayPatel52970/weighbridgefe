import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { KeyboardService } from '../../core/services/keyboard.service';
import { AuthService } from '../../core/services/auth.service';
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

  private subs = new Subscription();

  constructor(
    private kb: KeyboardService,
    private router: Router,
    public auth: AuthService,
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
        if (key === 'F2') this.router.navigate(['/weighment/second']);
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
