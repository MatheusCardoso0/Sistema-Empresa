import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Insurance {
  id?: number;
  client_id: number;
  client_name?: string;
  insurance_type: string;
  insurer: string;
  policy_number?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly apiUrl = 'http://localhost:3000/api/insurances';

  constructor(private readonly http: HttpClient) { }

  list(): Observable<Insurance[]> {
    return this.http.get<Insurance[]>(this.apiUrl, { withCredentials: true });
  }

  create(insurance: Insurance): Observable<Insurance> {
    return this.http.post<Insurance>(this.apiUrl, insurance, { withCredentials: true });
  }

  update(id: number, insurance: Insurance): Observable<Insurance> {
    return this.http.put<Insurance>(`${this.apiUrl}/${id}`, insurance, { withCredentials: true });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
