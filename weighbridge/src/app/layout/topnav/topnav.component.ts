import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeWeightService, ConnectionState } from '../../core/realtime/realtime-weight.service';
import { SavedProfile, WeightReadingDto } from '../../core/models';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  standalone: false,
  styles: [':host { display: contents; }']
})
export class TopnavComponent implements OnInit, OnDestroy {
  showLogoutDialog = false;
  hardLogout = false;

  liveWeight: WeightReadingDto | null = null;
  weightState: ConnectionState = 'disconnected';

  private subs = new Subscription();

  constructor(public auth: AuthService, private realtimeWeight: RealtimeWeightService) {}

  get profile(): SavedProfile | null {
    return this.auth.snapshot;
  }

  ngOnInit(): void {
    this.realtimeWeight.start(1);
    this.subs.add(
      this.realtimeWeight.weight$.subscribe(w => this.liveWeight = w)
    );
    this.subs.add(
      this.realtimeWeight.connectionState$.subscribe(s => this.weightState = s)
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  openLogout(): void {
    this.hardLogout = false;
    this.showLogoutDialog = true;
  }

  cancelLogout(): void {
    this.showLogoutDialog = false;
  }

  confirmLogout(): void {
    this.showLogoutDialog = false;
    this.auth.logout(this.hardLogout);
  }
}
