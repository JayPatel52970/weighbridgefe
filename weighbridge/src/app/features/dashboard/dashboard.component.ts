import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { KeyboardService } from '../../core/services/keyboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  private sub!: Subscription;

  constructor(
    private kb: KeyboardService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub = this.kb.shortcuts$.subscribe(key => {
      if (key === 'F1') this.router.navigate(['/weighment/first']);
      if (key === 'F2') this.router.navigate(['/weighment/second']);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
