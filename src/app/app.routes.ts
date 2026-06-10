import { Routes } from '@angular/router';
import { authGuard, adminGuard, cajaGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',      loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'menu',  loadComponent: () => import('./pages/menu/menu').then(m => m.Menu) },
  { path: 'cart',  loadComponent: () => import('./pages/cart/cart').then(m => m.Cart),   canActivate: [authGuard] },
  { path: 'orders',loadComponent: () => import('./pages/orders/orders').then(m => m.Orders), canActivate: [authGuard] },
  { path: 'admin',    loadComponent: () => import('./pages/admin/admin').then(m => m.Admin),         canActivate: [adminGuard] },
  { path: 'caja',     loadComponent: () => import('./pages/caja/caja').then(m => m.Caja),            canActivate: [cajaGuard] },
  { path: 'reportes', loadComponent: () => import('./pages/reportes/reportes').then(m => m.Reportes), canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
