import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaysResume, PaysDetail } from '../models/referentiel-pays.model';

@Injectable({ providedIn: 'root' })
export class ReferentielPaysService {
  private http = inject(HttpClient);
  private base = '/api/referentiel/pays';

  listAll() {
    return this.http.get<PaysResume[]>(this.base);
  }

  getOne(code: string) {
    return this.http.get<PaysDetail>(`${this.base}/${code}`);
  }
}
