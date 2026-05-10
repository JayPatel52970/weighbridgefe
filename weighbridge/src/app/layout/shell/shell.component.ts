import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  standalone: false
})
export class ShellComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  isWeighmentRoute = false;
  weighmentTitle = '';
  weighmentIcon = '';

  private previousRoute = '/dashboard';
  private sub = new Subscription();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.applyUrl(this.router.url);
    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => this.applyUrl(e.urlAfterRedirects))
    );
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  closeWeighment(): void {
    this.router.navigate([this.previousRoute]);
  }

  private applyUrl(url: string): void {
    if (url.startsWith('/weighment/')) {
      this.isWeighmentRoute = true;
      const meta = this.metaFor(url);
      this.weighmentTitle = meta.title;
      this.weighmentIcon = meta.icon;
    } else {
      this.isWeighmentRoute = false;
      this.previousRoute = url || '/dashboard';
    }
  }

  private metaFor(url: string): { title: string; icon: string } {
    if (url.startsWith('/weighment/first'))           return { title: 'First Weighment',   icon: 'bi-plus-circle' };
    if (url.startsWith('/weighment/second-direct'))  return { title: 'Direct Complete',    icon: 'bi-lightning-charge' };
    if (url.startsWith('/weighment/one-go'))         return { title: 'One-Go Weighment',   icon: 'bi-arrow-left-right' };
    if (url.startsWith('/weighment/print-duplicate'))return { title: 'Print Duplicate',    icon: 'bi-printer' };
    if (/\/weighment\/second\//.test(url))           return { title: 'Second Weighment',   icon: 'bi-clipboard-check' };
    if (url.startsWith('/weighment/second'))         return { title: 'Ticket List',        icon: 'bi-list-check' };
    return { title: 'Weighment', icon: 'bi-scale' };
  }
}
