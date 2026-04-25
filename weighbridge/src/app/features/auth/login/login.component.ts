import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SavedProfile } from '../../../core/models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: false
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  loading = false;
  profiles: SavedProfile[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.profiles = this.auth.getProfiles();
  }

  isExpired(p: SavedProfile): boolean {
    return this.auth.isExpired(p);
  }

  activateProfile(p: SavedProfile): void {
    if (this.auth.isExpired(p)) {
      this.error = `Session expired for ${p.username}. Please log in again.`;
      this.username = p.username;
      return;
    }
    if (this.auth.activateProfile(p.username)) {
      this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    this.error = '';
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Username and password are required.';
      return;
    }
    this.loading = true;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.error?.title || 'Login failed. Check credentials.';
      }
    });
  }
}
