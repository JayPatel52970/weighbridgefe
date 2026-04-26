import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AdminUser } from '../../../core/models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  standalone: false
})
export class UsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  showForm = false;
  newUsername = '';
  newPassword = '';
  newRoles: string[] = ['User'];
  saving = false;
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getUsers()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: r => { this.users = r; this.cdr.markForCheck(); } });
  }

  toggleRole(role: string): void {
    const idx = this.newRoles.indexOf(role);
    if (idx >= 0) this.newRoles.splice(idx, 1); else this.newRoles.push(role);
  }

  hasRole(role: string): boolean { return this.newRoles.includes(role); }

  save(): void {
    if (!this.newUsername.trim() || !this.newPassword.trim()) {
      this.error = 'Username and password are required.';
      return;
    }
    if (!this.newRoles.length) { this.error = 'Select at least one role.'; return; }
    this.error = '';
    this.saving = true;
    this.cdr.markForCheck();
    this.api.createUser({ username: this.newUsername, password: this.newPassword, roles: [...this.newRoles] })
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.showForm = false;
          this.newUsername = '';
          this.newPassword = '';
          this.newRoles = ['User'];
          this.load();
        },
        error: err => { this.error = err?.error?.message || 'Save failed.'; this.cdr.markForCheck(); }
      });
  }

  toggle(u: AdminUser): void {
    const action = u.isDisabled ? this.api.enableUser(u.id) : this.api.disableUser(u.id);
    action.subscribe(() => this.load());
  }

  delete(u: AdminUser): void {
    if (!confirm(`Delete user ${u.username}?`)) return;
    this.api.deleteUser(u.id).subscribe(() => this.load());
  }
}
