export interface KpiFinancier {
  ca: number;
  charges: number;
  resultatNet: number;
  tresorerie: number;
  margeNette: number;
}

export interface ExecBudget {
  previsionnel: number;
  realise: number;
  ecart: number;
  pct: number;
  nbLignes: number;
  nbDepassees: number;
}

export interface TopAxe {
  code: string;
  intitule: string;
  type: string;
  depenses: number;
  montantBudget: number | null;
  tauxExecution: number | null;
}

export interface MoisTendance {
  mois: number;
  ca: number;
  charges: number;
}

export interface TresorerieMois {
  mois: number;
  solde: number;
}

export interface RepartitionCharges {
  classeCompte: string;
  libelle: string;
  montant: number;
}

export interface Alerte {
  type: string;
  message: string;
  niveau: 'DANGER' | 'WARNING' | 'INFO';
}

export interface DashboardGlobal {
  exercice: number;
  financier: KpiFinancier;
  financierN1: KpiFinancier;
  budgetComptable: ExecBudget;
  budgetRh: ExecBudget;
  topAxes: TopAxe[];
  tendance: MoisTendance[];
  tendanceN1: MoisTendance[];
  tresorerieEvol: TresorerieMois[];
  repartitionCharges: RepartitionCharges[];
  alertes: Alerte[];
}

export const MOIS_COURTS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                             'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
