import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Ecriture, EcritureRequest, EcritureStats, Journal, PageResponse, StatutEcriture } from '../models/ecriture.model';

export interface CsvImportResult {
  created: number;
  skipped: number;
  errors: { ligne: number; numeroPiece: string; message: string }[];
}

@Injectable({ providedIn: 'root' })
export class EcritureService {

  constructor(private http: HttpClient) {}

  findAll(opts: {
    page?: number; size?: number;
    journal?: Journal | ''; statut?: StatutEcriture | '';
    from?: string; to?: string;
  } = {}) {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    if (opts.journal) params = params.set('journal', opts.journal);
    if (opts.statut)  params = params.set('statut',  opts.statut);
    if (opts.from)    params = params.set('from', opts.from);
    if (opts.to)      params = params.set('to',   opts.to);
    return this.http.get<PageResponse<Ecriture>>('/api/ecritures', { params });
  }

  stats() {
    return this.http.get<EcritureStats>('/api/ecritures/stats');
  }

  findOne(id: string) {
    return this.http.get<Ecriture>(`/api/ecritures/${id}`);
  }

  create(payload: EcritureRequest) {
    return this.http.post<Ecriture>('/api/ecritures', payload);
  }

  valider(id: string) {
    return this.http.post<Ecriture>(`/api/ecritures/${id}/valider`, {});
  }

  supprimer(id: string) {
    return this.http.delete<void>(`/api/ecritures/${id}`);
  }

  importCsv(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<CsvImportResult>('/api/ecritures/import', form);
  }
}
