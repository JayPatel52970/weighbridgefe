import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
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
    //console.log(`${TAG} Building hub. URL = ${hubUrl}`);

    const token = this.auth.token;
    //console.log(`${TAG} Token present at build time: ${!!token}`);

    this.hub = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          const t = this.auth.token ?? '';
          //console.log(`${TAG} accessTokenFactory called — token length: ${t.length}`);
          return t;
        }
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Information)
      .build();

    this.hub.on('ReceiveWeightUpdate', (reading: WeightReadingDto) => {
      //console.log(`${TAG} ReceiveWeightUpdate received:`, reading);
      this.zone.run(() => this.weight$.next(reading));
    });

    // Also listen for any other event name in case the backend name differs
    this.hub.onreconnecting(err => {
      console.warn(`${TAG} Reconnecting...`, err);
      this.zone.run(() => this.connectionState$.next('reconnecting'));
    });

    this.hub.onreconnected(async connId => {
      //console.log(`${TAG} Reconnected. connectionId = ${connId}`);
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
        console.error(`${TAG} Auth error on close — logging out`);
        this.zone.run(() => this.auth.logout(false));
      }
    });

    //console.log(`${TAG} Hub built. Hub state: ${this.hub.state}`);
  }

  async start(siteId = 1): Promise<void> {
    this.siteId = siteId;
    //console.log(`${TAG} start() called. siteId=${siteId}, _started=${this._started}, hub.state=${this.hub.state}`);

    if (this._started || this.hub.state === HubConnectionState.Connected) {
      //console.log(`${TAG} start() skipped — already started or connected`);
      return;
    }

    this._started = true;
    this.zone.run(() => this.connectionState$.next('connecting'));

    try {
      //console.log(`${TAG} Calling hub.start()...`);
      await this.hub.start();
      //console.log(`${TAG} hub.start() succeeded. Hub state: ${this.hub.state}`);
      this.zone.run(() => this.connectionState$.next('connected'));
      await this.invokeSubscribe();
    } catch (err: any) {
      console.error(`${TAG} hub.start() FAILED:`, err);
      this._started = false;
      this.zone.run(() => this.connectionState$.next('disconnected'));
      if (this.isAuthError(err)) {
        console.error(`${TAG} Treating as auth error — logging out`);
        this.zone.run(() => this.auth.logout(false));
      }
    }
  }

  async stop(): Promise<void> {
    //console.log(`${TAG} stop() called. Hub state: ${this.hub.state}`);
    this._started = false;
    if (this.hub.state !== HubConnectionState.Disconnected) {
      await this.hub.stop();
    }
  }

  private async invokeSubscribe(): Promise<void> {
    try {
      //console.log(`${TAG} Invoking Subscribe with siteId=${this.siteId}`);
      await this.hub.invoke('Subscribe', this.siteId);
      //console.log(`${TAG} Subscribe invoked successfully`);
    } catch (err) {
      console.warn(`${TAG} Subscribe invoke failed (may be optional):`, err);
    }
  }

  private isAuthError(err: Error | undefined): boolean {
    const msg = err?.message ?? '';
    return msg.includes('401') || msg.toLowerCase().includes('unauthorized');
  }

  ngOnDestroy(): void { this.hub.stop(); }
}
