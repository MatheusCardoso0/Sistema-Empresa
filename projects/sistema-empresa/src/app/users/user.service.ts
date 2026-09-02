import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemUser {
  id?: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'CORRETOR';
  active: boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = 'http://localhost:3000/api/users';

  constructor(private readonly http: HttpClient) { }

  list(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.apiUrl, { withCredentials: true });
  }

  create(user: SystemUser): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.apiUrl, user, { withCredentials: true });
  }

  update(id: number, user: SystemUser): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.apiUrl}/${id}`, user, { withCredentials: true });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
