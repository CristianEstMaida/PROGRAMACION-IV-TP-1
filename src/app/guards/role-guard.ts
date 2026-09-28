import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = await auth.getCurrentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const role = await auth.getUserRole(user.id);
  if (role === 'admin' || role === 'operador') {
    return true;
  }

  router.navigate(['/home']);
  return false;
};