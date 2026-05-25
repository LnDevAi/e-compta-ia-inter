export type Periodicite = 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';

export interface AbonnementResume {
  id:                string;
  nom:               string;
  periodicite:       Periodicite;
  montantTtc:        number;
  tiersId:           string | null;
  nomTiers:          string | null;
  actif:             boolean;
  prochaineEcheance: string;
}

export interface AbonnementResponse {
  id:                string;
  nom:               string;
  description:       string | null;
  periodicite:       Periodicite;
  montantHt:         number;
  tauxTva:           number;
  montantTtc:        number;
  compteProduit:     string | null;
  tiersId:           string | null;
  nomTiers:          string | null;
  dateDebut:         string;
  dateFin:           string | null;
  actif:             boolean;
  prochaineEcheance: string;
}

export interface AbonnementSaveRequest {
  nom:               string;
  description:       string | null;
  periodicite:       Periodicite;
  montantHt:         number;
  tauxTva:           number;
  compteProduit:     string | null;
  tiersId:           string | null;
  dateDebut:         string;
  dateFin:           string | null;
  prochaineEcheance: string;
}
