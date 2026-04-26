import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SavedProfile } from '../../core/models';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  standalone: false,
  styles: [':host { display: contents; }']
})
export class TopnavComponent {
  showLogoutDialog = false;
  hardLogout = false;

  constructor(public auth: AuthService) {}

  get profile(): SavedProfile | null {
    return this.auth.snapshot;
  }

  openLogout(): void {
    this.hardLogout = false;
    this.showLogoutDialog = true;
  }

  cancelLogout(): void {
    this.showLogoutDialog = false;
  }

  confirmLogout(): void {
    this.showLogoutDialog = false;
    this.auth.logout(this.hardLogout);
  }
}
