import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { KeyboardService } from '../../core/services/keyboard.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
  styles: [':host { display: contents; }']
})
export class SidebarComponent {
  constructor(public auth: AuthService, private kb: KeyboardService) {}

  get isAdmin(): boolean {
    return this.auth.hasRole('Admin');
  }

  openTicketLookup(): void {
    this.kb.trigger('F7');
  }
}
