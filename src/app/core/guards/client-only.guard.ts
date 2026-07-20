import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

// CORRECTION #5 — Seuls les CLIENT peuvent accéder au panier et checkout
// Un compte RESTAURANT ou LIVREUR ne peut pas commander
export const clientOnlyGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const notif  = inject(NotificationService);
  const role   = auth.role();

  // Seuls les guests et les CLIENTs peuvent commander. RESTAURANT ne peut pas commander.
  if (!role || role === 'CLIENT') return true;

  if (role === 'RESTAURANT') {
    notif.warning('En tant que restaurant, vous ne pouvez pas passer de commande.');
    router.navigate(['/dashboard/restaurant']);
  } else if (role === 'LIVREUR') {
    notif.warning('En tant que livreur, vous ne pouvez pas passer de commande.');
    router.navigate(['/dashboard/livreur']);
  } else {
    router.navigate(['/dashboard/admin']);
  }
  return false;
};
