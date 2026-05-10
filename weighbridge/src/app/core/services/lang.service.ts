import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LangService {
  readonly langs = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हि' },
    { code: 'gu', label: 'ગુ' }
  ];

  constructor(private translate: TranslateService) {
    const saved = localStorage.getItem('wb_lang') ?? 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(saved);
  }

  get currentLang(): string { return this.translate.currentLang; }

  setLang(code: string): void {
    this.translate.use(code);
    localStorage.setItem('wb_lang', code);
  }
}
