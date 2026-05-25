export interface SauvegarderPayeRequest {
  mois:                   number;
  nbSalaries:             number;
  masseSalarialeBrute:    number;
  cotisationsSalariales:  number;
  cotisationsPatronales:  number;
  impotRetenu:            number;
}

export interface PayeResponse {
  id:                     string;
  exercice:               number;
  mois:                   number;
  moisLibelle:            string;
  nbSalaries:             number;
  masseSalarialeBrute:    number;
  cotisationsSalariales:  number;
  cotisationsPatronales:  number;
  impotRetenu:            number;
  netAPayer:              number;
  coutTotal:              number;
  statut:                 'BROUILLON' | 'COMPTABILISEE';
  ecritureId:             string | null;
  createdAt:              string;
}

export const MOIS_LABELS: Record<number, string> = {
  1: 'Janvier', 2: 'Février',  3: 'Mars',     4: 'Avril',
  5: 'Mai',     6: 'Juin',     7: 'Juillet',  8: 'Août',
  9: 'Septembre', 10: 'Octobre', 11: 'Novembre', 12: 'Décembre'
};
