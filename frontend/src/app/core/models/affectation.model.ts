export interface InfoResultat {
  exercice: number;
  statut: string;
  resultatNet: number;
  dejAffecte: boolean;
}

export interface LigneAffectation {
  compteNumero: string;
  libelle: string;
  montant: number;
}

export interface AffectationRequest {
  lignes: LigneAffectation[];
}

export interface AffectationResponse {
  numeroPiece: string;
  exercice: number;
  resultatNet: number;
  lignes: LigneAffectation[];
}
