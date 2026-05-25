import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PosteResponse, CandidatureResponse,
  PosteSaveRequest, CandidatureSaveRequest, CandidatureAvancerRequest
} from '../models/recrutement.model';

@Injectable({ providedIn: 'root' })
export class RecrutementService {
  private http = inject(HttpClient);
  private base = '/api/recrutement';

  // Postes
  allPostes(): Observable<PosteResponse[]> {
    return this.http.get<PosteResponse[]>(`${this.base}/postes`);
  }

  postesOuverts(): Observable<PosteResponse[]> {
    return this.http.get<PosteResponse[]>(`${this.base}/postes/ouverts`);
  }

  createPoste(req: PosteSaveRequest): Observable<PosteResponse> {
    return this.http.post<PosteResponse>(`${this.base}/postes`, req);
  }

  updatePoste(id: string, req: PosteSaveRequest): Observable<PosteResponse> {
    return this.http.put<PosteResponse>(`${this.base}/postes/${id}`, req);
  }

  fermerPoste(id: string): Observable<PosteResponse> {
    return this.http.post<PosteResponse>(`${this.base}/postes/${id}/fermer`, {});
  }

  rouvrirPoste(id: string): Observable<PosteResponse> {
    return this.http.post<PosteResponse>(`${this.base}/postes/${id}/rouvrir`, {});
  }

  pourvoirPoste(id: string): Observable<PosteResponse> {
    return this.http.post<PosteResponse>(`${this.base}/postes/${id}/pourvoir`, {});
  }

  deletePoste(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/postes/${id}`);
  }

  // Candidatures
  allCandidatures(): Observable<CandidatureResponse[]> {
    return this.http.get<CandidatureResponse[]>(`${this.base}/candidatures`);
  }

  candidaturesPoste(pid: string): Observable<CandidatureResponse[]> {
    return this.http.get<CandidatureResponse[]>(`${this.base}/postes/${pid}/candidatures`);
  }

  createCandidature(req: CandidatureSaveRequest): Observable<CandidatureResponse> {
    return this.http.post<CandidatureResponse>(`${this.base}/candidatures`, req);
  }

  avancer(id: string, req: CandidatureAvancerRequest): Observable<CandidatureResponse> {
    return this.http.post<CandidatureResponse>(`${this.base}/candidatures/${id}/avancer`, req);
  }

  rejeter(id: string, req: CandidatureAvancerRequest): Observable<CandidatureResponse> {
    return this.http.post<CandidatureResponse>(`${this.base}/candidatures/${id}/rejeter`, req);
  }

  deleteCandidature(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/candidatures/${id}`);
  }
}
