import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private http: HttpClient) {}

  private download(url: string, params: HttpParams, filename: string) {
    return this.http.get(url, { params, responseType: 'blob' }).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  balance(debut: string, fin: string) {
    this.download('/api/export/balance',
      new HttpParams().set('debut', debut).set('fin', fin),
      `balance_${debut}_${fin}.csv`);
  }

  grandLivre(debut: string, fin: string, compte: string) {
    this.download('/api/export/grand-livre',
      new HttpParams().set('debut', debut).set('fin', fin).set('compte', compte),
      `grand_livre_${compte}_${debut}_${fin}.csv`);
  }

  ecritures(debut: string, fin: string) {
    this.download('/api/export/ecritures',
      new HttpParams().set('debut', debut).set('fin', fin),
      `ecritures_${debut}_${fin}.csv`);
  }

  fec(exercice: number) {
    this.download('/api/export/fec',
      new HttpParams().set('exercice', exercice),
      `FEC_${exercice}.txt`);
  }
}
