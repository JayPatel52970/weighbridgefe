import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { WeightReadingDto } from '../models';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class RealtimeWeightService implements OnDestroy {
  private hub: HubConnection;
  private siteId = 1;
  private _started = false;

  weight$ = new BehaviorSubject<WeightReadingDto | null>(null);
  connectionState$ = new BehaviorSubject<ConnectionState>('disconnected');

  constructor(private auth: AuthService, private zone: NgZone) {
    this.hub = new HubConnectionBuilder()
      .withUrl(`${environment.apiBase}/hubs/weight`, {
        accessTokenFactory: () => this.auth.token ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    this.hub.on('weight', (reading: WeightReadingDto) => {
      this.zone.run(() => this.weight$.next(reading));
    });

    this.hub.onreconnecting(() => {
      this.zone.run(() => this.connectionState$.next('reconnecting'));
    });

    this.hub.onreconnected(async () => {
      this.zone.run(() => this.connectionState$.next('connected'));
      await this.invokeSubscribe();
    });

    this.hub.onclose(err => {
      this.zone.run(() => {
        this.connectionState$.next('disconnected');
        this._started = false;
      });
      if (this.isAuthError(err)) {
        this.zone.run(() => this.auth.logout(false));
      }
    });
  }

  async start(siteId = 1): Promise<void> {
    if (this._started || this.hub.state === HubConnectionState.Connected) return;
    this.siteId = siteId;
    this._started = true;
    this.zone.run(() => this.connectionState$.next('connecting'));
    try {
      await this.hub.start();
      this.zone.run(() => this.connectionState$.next('connected'));
      await this.invokeSubscribe();
    } catch (err: any) {
      this._started = false;
      this.zone.run(() => this.connectionState$.next('disconnected'));
      if (this.isAuthError(err)) {
        this.zone.run(() => this.auth.logout(false));
      }
    }
  }

  async stop(): Promise<void> {
    this._started = false;
    if (this.hub.state !== HubConnectionState.Disconnected) {
      await this.hub.stop();
    }
  }

  private async invokeSubscribe(): Promise<void> {
    try {
      await this.hub.invoke('Subscribe', this.siteId);
    } catch { /* hub may not have this method in all backends */ }
  }

  private isAuthError(err: Error | undefined): boolean {
    const msg = err?.message ?? '';
    return msg.includes('401') || msg.toLowerCase().includes('unauthorized');
  }

  ngOnDestroy(): void { this.hub.stop(); }
}
