export type Journal = 'AC' | 'BQ' | 'OD' | 'VT';
export type StatutEcriture = 'BROUILLON' | 'VALIDEE' | 'CLOTUREE';

export const JOURNAL_LABELS: Record<Journal, string> = {
  AC: 'Achats', BQ: 'Banque', OD: 'Op. diverses', VT: 'Ventes'
};

export interface LigneEcriture {
  id?: string;
  compteId: string;
  compteNumero?: string;
  compteIntitule?: string;
  libelle?: string;
  debit: number;
  credit: number;
}

export interface Ecriture {
  id: string;
  numeroPiece: string;
  dateEcriture: string;
  libelle: string;
  journal: Journal;
  statut: StatutEcriture;
  lignes: LigneEcriture[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface EcritureRequest {
  numeroPiece: string;
  dateEcriture: string;
  libelle: string;
  journal: Journal;
  lignes: LigneEcriture[];
}

export interface EcritureStats {
  totalEcritures: number;
  brouillons: number;
  validees: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
