import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, SavedProfile } from '../models';

const PROFILES_KEY = 'wb.profiles';
const ACTIVE_KEY = 'wb.activeProfile';

function decodeExp(token: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp as number;
  } catch {
    return undefined;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private activeProfile$ = new BehaviorSubject<SavedProfile | null>(null);
  activeProfile = this.activeProfile$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.restoreActive();
  }

  private restoreActive(): void {
    const username = localStorage.getItem(ACTIVE_KEY);
    if (!username) return;
    const profile = this.getProfile(username);
    if (profile && !this.isExpired(profile)) {
      this.activeProfile$.next(profile);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBase}/api/auth/login`, req).pipe(
      tap(res => this.saveAndActivate(res))
    );
  }

  private saveAndActivate(res: LoginResponse): void {
    const profile: SavedProfile = {
      username: res.username,
      accessToken: res.accessToken,
      roles: res.roles,
      lastLoginAt: new Date().toISOString(),
      exp: decodeExp(res.accessToken)
    };
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.username === profile.username);
    if (idx >= 0) profiles[idx] = profile; else profiles.push(profile);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_KEY, profile.username);
    this.activeProfile$.next(profile);
  }

  activateProfile(username: string): boolean {
    const profile = this.getProfile(username);
    if (!profile || this.isExpired(profile)) return false;
    localStorage.setItem(ACTIVE_KEY, username);
    this.activeProfile$.next(profile);
    return true;
  }

  logout(hard: boolean): void {
    if (hard) {
      localStorage.removeItem(PROFILES_KEY);
      localStorage.removeItem(ACTIVE_KEY);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
    this.activeProfile$.next(null);
    this.router.navigate(['/auth/login']);
  }

  getProfiles(): SavedProfile[] {
    try {
      return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
    } catch {
      return [];
    }
  }

  getProfile(username: string): SavedProfile | undefined {
    return this.getProfiles().find(p => p.username === username);
  }

  isExpired(profile: SavedProfile): boolean {
    if (!profile.exp) return false;
    return Date.now() / 1000 > profile.exp;
  }

  get snapshot(): SavedProfile | null {
    return this.activeProfile$.value;
  }

  isLoggedIn(): boolean {
    const p = this.snapshot;
    return !!p && !this.isExpired(p);
  }

  hasRole(role: string): boolean {
    return this.snapshot?.roles?.includes(role) ?? false;
  }

  get token(): string | null {
    return this.snapshot?.accessToken ?? null;
  }
}
