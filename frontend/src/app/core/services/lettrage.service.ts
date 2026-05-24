import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompteLettrageView, LettrageResult } from '../models/lettrage.model';

@Injectable({ providedIn: 'root' })
export class LettrageService {
  constructor(private http: HttpClient) {}

  getLignes(compteNumero: string) {
    return this.http.get<CompteLettrageView>(`/api/lettrage/${compteNumero}`);
  }

  lettrer(compteNumero: string, ligneIds: string[]) {
    return this.http.post<LettrageResult>(`/api/lettrage/${compteNumero}/lettrer`, { ligneIds });
  }

  delettrer(compteNumero: string, lettre: string) {
    return this.http.post<void>(`/api/lettrage/${compteNumero}/delettrer`, { lettre });
  }
}
