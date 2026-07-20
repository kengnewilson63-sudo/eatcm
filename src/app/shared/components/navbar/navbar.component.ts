import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CommandeService } from '../../../core/services/commande.service';
import { NotificationsPanelComponent } from '../../../shared/components/notifications-panel/notifications-panel.component';


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, NotificationsPanelComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  auth     = inject(AuthService);
  commande = inject(CommandeService);
  router   = inject(Router);

  readonly user       = this.auth.currentUser;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly role       = this.auth.role;
  readonly totalItems = this.commande.totalItems;

  searchOpen  = signal(false);
  searchQuery = signal('');
  menuOpen    = signal(false);

  toggleSearch(): void { this.searchOpen.update(v => !v); if (!this.searchOpen()) this.searchQuery.set(''); }
  toggleMenu(): void   { this.menuOpen.update(v => !v); }
  closeMenu(): void    { this.menuOpen.set(false); }

  onSearch(e: Event): void {
    const q = (e.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    if (q.trim().length > 1) this.router.navigate(['/search'], { queryParams: { q } });
  }

  logout(): void { this.closeMenu(); this.auth.logout(); }

  getDashboardRoute(): string {
    const r = this.role();
    if (r === 'RESTAURANT') return '/dashboard/restaurant';
    if (r === 'LIVREUR')    return '/dashboard/livreur';
    if (r === 'ADMIN')      return '/dashboard/admin';
    return '/dashboard/client';
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '';
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  // CORRECTION #6 — badge rôle visible
  getRoleBadgeClass(): string {
    const r = this.role();
    if (r === 'CLIENT')     return 'role-badge-client';
    if (r === 'RESTAURANT') return 'role-badge-restaurant';
    if (r === 'LIVREUR')    return 'role-badge-livreur';
    if (r === 'ADMIN')      return 'role-badge-admin';
    return '';
  }

  getRoleLabel(): string {
    const r = this.role();
    if (r === 'CLIENT')     return '🛒 Client';
    if (r === 'RESTAURANT') return '🍽️ Restaurant';
    if (r === 'LIVREUR')    return '🛵 Livreur';
    if (r === 'ADMIN')      return '⚙️ Admin';
    return '';
  }

  onAvatarSelected(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = reader.result as string | null;
      const token = this.auth.getToken();
      const u = this.user();
      if (u) {
        const updated = { ...u, avatar: img ?? undefined };
        this.auth.saveSession(token || '', updated);
      }
    };
    reader.readAsDataURL(f);
  }
}
