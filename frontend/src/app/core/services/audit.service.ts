import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditEvent, AuditStats, PageResponse } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private http: HttpClient) {}

  lister(filters: {
    action?: string;
    entityType?: string;
    userEmail?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) {
    let params = new HttpParams();
    if (filters.action)     params = params.set('action',     filters.action);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.userEmail)  params = params.set('userEmail',  filters.userEmail);
    if (filters.from)       params = params.set('from', filters.from);
    if (filters.to)         params = params.set('to',   filters.to);
    params = params.set('page', String(filters.page ?? 0));
    params = params.set('size', String(filters.size ?? 50));
    return this.http.get<PageResponse<AuditEvent>>('/api/audit', { params });
  }

  stats() {
    return this.http.get<AuditStats>('/api/audit/stats');
  }
}
