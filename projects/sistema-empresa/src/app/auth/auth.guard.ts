import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  canActivate() {
    return this.authService.currentUser().pipe(
      map(() => true),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
