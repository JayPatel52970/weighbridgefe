import { Injectable, NgZone } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';

const REQUEST_TIMEOUT_MS = 20_000;

@Injectable()
export class ZoneInterceptor implements HttpInterceptor {
  constructor(private ngZone: NgZone) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return new Observable<HttpEvent<unknown>>(observer => {
      const sub = next.handle(req)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
        .subscribe({
          next: event => this.ngZone.run(() => observer.next(event)),
          error: err => {
            const wrapped = err instanceof TimeoutError
              ? Object.assign(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${req.url}`), { status: 0 })
              : err;
            this.ngZone.run(() => observer.error(wrapped));
          },
          complete: () => this.ngZone.run(() => observer.complete())
        });
      return () => sub.unsubscribe();
    });
  }
}
