import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RolUsuario } from '../../application/use-cases/auth.service';

/**
 * Guard de rol simple para auth demo en cliente.
 * En SSR deja pasar y el cliente vuelve a evaluar al hidratar.
 */
export const roleGuard: CanActivateFn = (route) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = auth.session();
  if (!session) {
    return router.createUrlTree(['/login']);
  }
  const allowed = (route.data?.['roles'] as RolUsuario[] | undefined) ?? [];
  if (allowed.length === 0 || allowed.includes(session.rol)) {
    return true;
  }
  return router.createUrlTree(['/inicio']);
};

