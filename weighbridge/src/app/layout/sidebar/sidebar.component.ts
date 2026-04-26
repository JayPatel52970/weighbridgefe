import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
  styles: [':host { display: contents; }']
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}

  get isAdmin(): boolean {
    return this.auth.hasRole('Admin');
  }
}
