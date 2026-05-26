export interface TiersImpaye {
  tiersId: string;
  tiersCode: string;
  tiersNom: string;
  tiersEmail: string | null;
  compteNumero: string;
  montantImpaye: number;
  nbJours: number;
  nbRelances: number;
  derniereRelance: string | null;
}

export interface ListeImpayes {
  clients: TiersImpaye[];
  totalImpaye: number;
  nbClientsImpaye: number;
}

export interface RelanceRecord {
  id: string;
  tiersId: string;
  tiersNom: string;
  montantRelance: number;
  niveau: number;
  note: string | null;
  dateRelance: string;
}
