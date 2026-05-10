import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LangService {
  readonly langs = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हि' },
    { code: 'gu', label: 'ગુ' }
  ];

  constructor(private translate: TranslateService, private auth: AuthService) {
    this.translate.setDefaultLang('en');
    const saved = localStorage.getItem('wb_lang') ?? 'en';
    this.translate.use(saved);

    // Apply the user's preferred language whenever a profile becomes active.
    // BehaviorSubject emits immediately, so session restore on startup is handled too.
    this.auth.activeProfile.subscribe(profile => {
      if (profile?.language) {
        this.setLang(profile.language);
      }
    });
  }

  get currentLang(): string { return this.translate.currentLang; }

  setLang(code: string): void {
    this.translate.use(code);
    localStorage.setItem('wb_lang', code);
  }
}
