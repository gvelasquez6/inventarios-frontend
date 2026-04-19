import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenStore } from './auth-token.store';
import { environment } from '../../../environments/environment';

export const authBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBaseUrl;
  if (!req.url.startsWith(base)) {
    return next(req);
  }
  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }
  const tokenStore = inject(AuthTokenStore);
  const token = tokenStore.getAccessToken();
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
