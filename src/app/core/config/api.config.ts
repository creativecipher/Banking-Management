import { InjectionToken } from '@angular/core';

/**
 * Base URL of the backend API. Services inject this token instead of
 * hard-coding a URL, so Phase 10 can point the app at a real backend
 * by changing a single provider.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});