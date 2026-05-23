export interface Compte {
  id: string;
  numero: string;
  intitule: string;
  classe: number;
  actif: boolean;
  createdAt: string;
}

export interface CompteRequest {
  numero: string;
  intitule: string;
  classe: number;
}

export interface CompteUpdateRequest {
  numero?: string;
  intitule?: string;
}

export const CLASSE_LABELS: Record<number, string> = {
  1: 'Ressources durables',
  2: 'Actif immobilisé',
  3: 'Stocks',
  4: 'Tiers',
  5: 'Trésorerie',
  6: 'Charges',
  7: 'Produits',
  8: 'Autres charges et produits',
  9: 'Comptabilité analytique',
};
