import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ListeImpayes, RelanceRecord } from '../models/relance.model';

@Injectable({ providedIn: 'root' })
export class RelanceService {
  constructor(private http: HttpClient) {}

  getImpayes() {
    return this.http.get<ListeImpayes>('/api/relances/impayes');
  }

  lister() {
    return this.http.get<RelanceRecord[]>('/api/relances');
  }

  listerParTiers(tiersId: string) {
    return this.http.get<RelanceRecord[]>(`/api/relances/tiers/${tiersId}`);
  }

  creer(tiersId: string, montantRelance: number, niveau: number, note: string) {
    return this.http.post<RelanceRecord>('/api/relances', { tiersId, montantRelance, niveau, note });
  }

  supprimer(id: string) {
    return this.http.delete<void>(`/api/relances/${id}`);
  }
}
