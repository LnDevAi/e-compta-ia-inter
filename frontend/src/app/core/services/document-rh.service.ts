import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DocumentRhResponse, DocumentRhRequest } from '../models/document-rh.model';

@Injectable({ providedIn: 'root' })
export class DocumentRhService {
  private base = '/api/documents-rh';
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<DocumentRhResponse[]>(this.base);
  }

  findByCollaborateur(uid: string) {
    return this.http.get<DocumentRhResponse[]>(`${this.base}/collaborateur/${uid}`);
  }

  findExpirant(jours = 30) {
    const params = new HttpParams().set('jours', jours);
    return this.http.get<DocumentRhResponse[]>(`${this.base}/expirant`, { params });
  }

  create(req: DocumentRhRequest) {
    return this.http.post<DocumentRhResponse>(this.base, req);
  }

  update(id: string, req: DocumentRhRequest) {
    return this.http.put<DocumentRhResponse>(`${this.base}/${id}`, req);
  }

  archiver(id: string) {
    return this.http.post<DocumentRhResponse>(`${this.base}/${id}/archiver`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
