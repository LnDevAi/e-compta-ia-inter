import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EcritureEnAttenteResume,
  ApprobationResponse,
  DecisionRequest
} from '../models/approbation.model';

@Injectable({ providedIn: 'root' })
export class ApprobationService {
  private http = inject(HttpClient);
  private base = '/api/approbations';

  enAttente(): Observable<EcritureEnAttenteResume[]> {
    return this.http.get<EcritureEnAttenteResume[]>(`${this.base}/en-attente`);
  }

  historique(ecritureId: string): Observable<ApprobationResponse[]> {
    return this.http.get<ApprobationResponse[]>(`${this.base}/historique/${ecritureId}`);
  }

  soumettre(ecritureId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/soumettre/${ecritureId}`, {});
  }

  decider(ecritureId: string, req: DecisionRequest): Observable<ApprobationResponse> {
    return this.http.post<ApprobationResponse>(`${this.base}/decider/${ecritureId}`, req);
  }

  annuler(ecritureId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/annuler/${ecritureId}`, {});
  }
}
