import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

export type ShortcutKey = 'F1' | 'F2' | 'F3' | 'F5' | 'Escape' | 'CtrlP' | 'ArrowUp' | 'ArrowDown' | 'Enter';

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private shortcut$ = new Subject<ShortcutKey>();
  shortcuts$ = this.shortcut$.asObservable();

  constructor(private zone: NgZone) {
    document.addEventListener('keydown', (e) => {
      try {
        this.zone.run(() => this.handle(e));
      } catch { /* prevent one bad subscriber from killing the listener */ }
    });
  }

  private handle(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName?.toLowerCase();
    const inInput = ['input', 'textarea', 'select'].includes(tag);

    if (e.key === 'F1') { e.preventDefault(); this.shortcut$.next('F1'); return; }
    if (e.key === 'F2') { e.preventDefault(); this.shortcut$.next('F2'); return; }
    if (e.key === 'F3') { e.preventDefault(); this.shortcut$.next('F3'); return; }
    if (e.key === 'F5') { e.preventDefault(); this.shortcut$.next('F5'); return; }
    if (e.key === 'Escape') { this.shortcut$.next('Escape'); return; }
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); this.shortcut$.next('CtrlP'); return; }

    if (!inInput) {
      if (e.key === 'ArrowUp') { e.preventDefault(); this.shortcut$.next('ArrowUp'); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); this.shortcut$.next('ArrowDown'); return; }
      if (e.key === 'Enter') { this.shortcut$.next('Enter'); return; }
    }
  }
}
