import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService), router = inject(Router);
  const user = auth.currentUser();
  const required = route.data['role'] as string;
  if (
    user &&
    (user.role === 'RESTAURANT' || user.role === 'LIVREUR') &&
    user.statut === 'EN_ATTENTE'
  ) {
    router.navigate(['/auth/en-attente-validation']);
    return false;
  }
  if (user?.role === required) return true;
  router.navigate(['/home']);
  return false;
};
