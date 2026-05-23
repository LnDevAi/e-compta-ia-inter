import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Compte, CompteRequest, CompteUpdateRequest } from '../models/compte.model';

@Injectable({ providedIn: 'root' })
export class CompteService {

  constructor(private http: HttpClient) {}

  findAll(q?: string) {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Compte[]>('/api/comptes', { params });
  }

  findByClasse(classe: number) {
    return this.http.get<Compte[]>(`/api/comptes/classe/${classe}`);
  }

  create(payload: CompteRequest) {
    return this.http.post<Compte>('/api/comptes', payload);
  }

  update(id: string, payload: CompteUpdateRequest) {
    return this.http.patch<Compte>(`/api/comptes/${id}`, payload);
  }

  toggleActif(id: string) {
    return this.http.patch<Compte>(`/api/comptes/${id}/toggle`, {});
  }
}
