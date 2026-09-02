import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'CORRETOR';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) { }

  login(username: string, password: string): Observable<{ user: AuthUser }> {
    return this.http.post<{ user: AuthUser }>(
      `${this.apiUrl}/auth/login`,
      { username, password },
      { withCredentials: true }
    );
  }

  currentUser(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true }
    );
  }

  updateProfile(user: { name: string; username: string; password?: string }): Observable<{ user: AuthUser }> {
    return this.http.put<{ user: AuthUser }>(
      `${this.apiUrl}/auth/me`,
      user,
      { withCredentials: true }
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    );
  }
}
