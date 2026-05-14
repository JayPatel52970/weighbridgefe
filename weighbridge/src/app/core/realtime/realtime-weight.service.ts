import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { WeightReadingDto } from '../models';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

const TAG = '[RealtimeWeight]';

@Injectable({ providedIn: 'root' })
export class RealtimeWeightService implements OnDestroy {
  private hub: HubConnection;
  private _started = false;
  private siteId = 1;

  weight$ = new BehaviorSubject<WeightReadingDto | null>(null);
  connectionState$ = new BehaviorSubject<ConnectionState>('disconnected');

  constructor(private auth: AuthService, private zone: NgZone) {
    const hubUrl = `${environment.apiBase}/hubs/weight`;

    this.hub = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.auth.token ?? '',
        // Try WebSocket first; if it fails during negotiation, fall back to long polling
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.hub.on('ReceiveWeightUpdate', (reading: WeightReadingDto) => {
      this.zone.run(() => this.weight$.next(reading));
    });

    this.hub.onreconnecting(err => {
      console.warn(`${TAG} Reconnecting...`, err);
      this.zone.run(() => this.connectionState$.next('reconnecting'));
    });

    this.hub.onreconnected(async () => {
      this.zone.run(() => this.connectionState$.next('connected'));
      await this.invokeSubscribe();
    });

    this.hub.onclose(err => {
      console.warn(`${TAG} Connection closed.`, err ?? 'no error');
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
    this.siteId = siteId;
    if (this._started || this.hub.state === HubConnectionState.Connected) return;

    this._started = true;
    this.zone.run(() => this.connectionState$.next('connecting'));

    try {
      await this.hub.start();
      console.log(`${TAG} Connected via ${(this.hub as any).connection?.transport?.name ?? 'unknown transport'}`);
      this.zone.run(() => this.connectionState$.next('connected'));
      await this.invokeSubscribe();
    } catch (err: any) {
      console.error(`${TAG} hub.start() failed:`, err);
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
    } catch (err) {
      console.warn(`${TAG} Subscribe invoke failed:`, err);
    }
  }

  private isAuthError(err: Error | undefined): boolean {
    const msg = err?.message ?? '';
    return msg.includes('401') || msg.toLowerCase().includes('unauthorized');
  }

  ngOnDestroy(): void { this.hub.stop(); }
}
