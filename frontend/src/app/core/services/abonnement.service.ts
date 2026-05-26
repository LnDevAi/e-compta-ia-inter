import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbonnementResume, AbonnementResponse, AbonnementSaveRequest } from '../models/abonnement.model';

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private http = inject(HttpClient);
  private base = '/api/abonnements';

  list(): Observable<AbonnementResume[]> {
    return this.http.get<AbonnementResume[]>(this.base);
  }

  get(id: string): Observable<AbonnementResponse> {
    return this.http.get<AbonnementResponse>(`${this.base}/${id}`);
  }

  create(req: AbonnementSaveRequest): Observable<AbonnementResponse> {
    return this.http.post<AbonnementResponse>(this.base, req);
  }

  update(id: string, req: AbonnementSaveRequest): Observable<AbonnementResponse> {
    return this.http.put<AbonnementResponse>(`${this.base}/${id}`, req);
  }

  toggle(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/toggle`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  generer(id: string): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/generer`, {});
  }
}
