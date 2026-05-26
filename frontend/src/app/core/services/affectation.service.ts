import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AffectationRequest, AffectationResponse, InfoResultat } from '../models/affectation.model';

@Injectable({ providedIn: 'root' })
export class AffectationService {
  constructor(private http: HttpClient) {}

  getInfo(exercice: number) {
    return this.http.get<InfoResultat>(`/api/affectation/${exercice}`);
  }

  affecter(exercice: number, request: AffectationRequest) {
    return this.http.post<AffectationResponse>(`/api/affectation/${exercice}`, request);
  }
}
