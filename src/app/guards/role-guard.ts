import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const roleGuard: CanMatchFn = async (route, segments) => {
  const auth = inject(Auth);
  const user = await auth.getCurrentUser();

  console.log("roleGuard ejecutado");

  // El rol esperado se pasa en la data de la ruta
  const expectedRole = route.data?.['role'];

  if (!user) return false;

  const userRole = await auth.getUserRole(user.id);

  return userRole === expectedRole;
};
