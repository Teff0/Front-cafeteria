import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLogged()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  inject(Router).navigate([auth.isLogged() ? '/' : '/login']);
  return false;
};

export const cajaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isCaja()) return true;
  inject(Router).navigate([auth.isLogged() ? '/' : '/login']);
  return false;
};
