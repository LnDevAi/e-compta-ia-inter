export interface LigneLettrage {
  id: string;
  dateEcriture: string;
  numeroPiece: string;
  libelle: string;
  debit: number;
  credit: number;
  lettre: string | null;
  lettreDate: string | null;
}

export interface CompteLettrageView {
  compteNumero: string;
  compteIntitule: string;
  lignes: LigneLettrage[];
}

export interface LettrageResult {
  lettre: string;
  nbLignes: number;
}
