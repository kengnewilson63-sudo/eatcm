import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  auth        = inject(AuthService);
  sidebarOpen = signal(false);

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeMenu(): void     { this.sidebarOpen.set(false); }

  navItems = computed(() => {
    const role = this.auth.role();
    if (role === 'RESTAURANT') return [
      { label:'Commandes',    icon:'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0', route:'/dashboard/restaurant/commandes' },
      { label:'Mon Menu',     icon:'M12 5v14M5 12h14',                                                                  route:'/dashboard/restaurant/menu' },
      { label:'Statistiques', icon:'M18 20V10M12 20V4M6 20v-6',                                                        route:'/dashboard/restaurant/stats' },
      { label:'Mes livreurs', icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', route:'/dashboard/restaurant/livreurs' },
       { label:'Horaires', icon:'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 v 9 0 0 1 18 0z', route:'/dashboard/restaurant/horaires' },
    ];
    if (role === 'LIVREUR') return [
      { label:'Mes courses', icon:'M1 3h15v13H1zM16 8h4l3 5v3h-7V8z', route:'/dashboard/livreur/courses' },
      { label:'Mon wallet',  icon:'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5', route:'/dashboard/livreur/wallet' },
    ];
    if (role === 'ADMIN') return [
      { label:'Restaurants', icon:'M3 2h18v4H3zM3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z', route:'/dashboard/admin/restaurants' },
      { label:'Livreurs',    icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', route:'/dashboard/admin/livreurs' },
      { label:'Commandes',   icon:'M9 11l3 3L22 4', route:'/dashboard/admin/commandes' },
      { label:'Finances',    icon:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', route:'/dashboard/admin/finances' },
      { label:'Litiges',     icon:'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', route:'/dashboard/admin/litiges' },
     
    ];
    return [];
  });

  getRoleBadgeClass(): string {
    const r = this.auth.role();
    if (r === 'RESTAURANT') return 'role-badge-restaurant';
    if (r === 'LIVREUR')    return 'role-badge-livreur';
    if (r === 'ADMIN')      return 'role-badge-admin';
    return 'role-badge-client';
  }

  getRoleLabel(): string {
    const r = this.auth.role();
    if (r === 'RESTAURANT') return '🍽️ Restaurant';
    if (r === 'LIVREUR')    return '🛵 Livreur';
    if (r === 'ADMIN')      return '⚙️ Admin';
    return '🛒 Client';
  }

  getInitials(): string {
    const u = this.auth.currentUser();
    if (!u) return 'U';
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  logout(): void { this.auth.logout(); }
}
