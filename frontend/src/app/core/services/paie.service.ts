import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PayeResponse, SauvegarderPayeRequest } from '../models/paie.model';

@Injectable({ providedIn: 'root' })
export class PayeService {
  constructor(private http: HttpClient) {}

  lister(exercice: number) {
    return this.http.get<PayeResponse[]>('/api/paie',
      { params: new HttpParams().set('exercice', exercice) });
  }

  sauvegarder(exercice: number, req: SauvegarderPayeRequest) {
    return this.http.post<PayeResponse>(`/api/paie/${exercice}`, req);
  }

  comptabiliser(id: string) {
    return this.http.post<PayeResponse>(`/api/paie/${id}/comptabiliser`, {});
  }

  supprimer(id: string) {
    return this.http.delete<void>(`/api/paie/${id}`);
  }
}
