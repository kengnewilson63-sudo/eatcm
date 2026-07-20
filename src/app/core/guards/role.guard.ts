import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService), router = inject(Router);
  const required = route.data['role'] as string;
  if (auth.currentUser()?.role === required) return true;
  router.navigate(['/home']);
  return false;
};
