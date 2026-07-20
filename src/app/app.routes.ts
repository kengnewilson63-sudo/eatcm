import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { clientOnlyGuard } from './core/guards/client-only.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',           loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'discover',       loadComponent: () => import('./features/discover/discover.component').then(m => m.DiscoverComponent) },
      { path: 'restaurant/:id', loadComponent: () => import('./features/restaurant/restaurant-detail/restaurant-detail.component').then(m => m.RestaurantDetailComponent) },
      { path: 'search',         loadComponent: () => import('./features/restaurant/search/search.component').then(m => m.SearchComponent) },
      { path: 'panier',   canActivate:[authGuard, clientOnlyGuard], loadComponent: () => import('./features/commande/panier/panier.component').then(m => m.PanierComponent) },
      { path: 'checkout', canActivate:[authGuard, clientOnlyGuard], loadComponent: () => import('./features/commande/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'suivi/:id', canActivate:[authGuard], loadComponent: () => import('./features/commande/suivi/suivi.component').then(m => m.SuiviComponent) },
      { path: 'profil',    canActivate:[authGuard], loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent) },
      { path: 'favoris',   canActivate:[authGuard, clientOnlyGuard], loadComponent: () => import('./features/favoris/favoris.component').then(m => m.FavorisComponent) },
    ],
  },
  {
    path: 'auth',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
    ],
  },
  {
    path: 'dashboard/client',
    canActivate: [authGuard, clientOnlyGuard],
    loadComponent: () => import('./features/dashboard-client/dashboard-client.component')
      .then(m => m.DashboardClientComponent),
  },
  {
    path: 'dashboard/restaurant',
    canActivate:[authGuard, roleGuard], data:{role:'RESTAURANT'},
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'commandes', pathMatch: 'full' },
      { path: 'commandes', loadComponent: () => import('./features/dashboard-restaurant/commandes/commandes.component').then(m => m.CommandesComponent) },
      { path: 'menu',      loadComponent: () => import('./features/dashboard-restaurant/menu-management/menu-management.component').then(m => m.MenuManagementComponent) },
      { path: 'stats',     loadComponent: () => import('./features/dashboard-restaurant/stats/stats.component').then(m => m.StatsComponent) },
      { path: 'livreurs',  loadComponent: () => import('./features/dashboard-restaurant/livreurs/livreurs.component').then(m => m.LivreursRestaurantComponent) },
      { path: 'horaires', loadComponent: () => import('./features/dashboard-restaurant/horaires/horaires.component').then(m => m.HorairesComponent) },
    ],
  },
  {
    path: 'dashboard/livreur',
    canActivate:[authGuard, roleGuard], data:{role:'LIVREUR'},
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses', loadComponent: () => import('./features/dashboard-livreur/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'wallet',  loadComponent: () => import('./features/dashboard-livreur/wallet/wallet.component').then(m => m.WalletComponent) },
    ],
  },
  {
    path: 'dashboard/admin',
    canActivate:[authGuard, roleGuard], data:{role:'ADMIN'},
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'restaurants', pathMatch: 'full' },
      { path: 'restaurants', loadComponent: () => import('./features/dashboard-admin/restaurants/restaurants.component').then(m => m.RestaurantsComponent) },
      { path: 'livreurs',    loadComponent: () => import('./features/dashboard-admin/livreurs/livreurs.component').then(m => m.LivreursComponent) },
      { path: 'commandes',   loadComponent: () => import('./features/dashboard-admin/commandes/commandes.component').then(m => m.CommandesComponent) },
      { path: 'finances',    loadComponent: () => import('./features/dashboard-admin/finances/finances.component').then(m => m.FinancesComponent) },
      { path: 'litiges',     loadComponent: () => import('./features/dashboard-admin/litiges/litiges.component').then(m => m.LitigesComponent) },
    ],
  },
  { path: '**', redirectTo: 'home' },
];