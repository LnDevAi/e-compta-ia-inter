export type SensBudget = 'DEBIT' | 'CREDIT';

export interface LigneComparatif {
  compteNumero: string;
  intitule: string;
  sens: SensBudget;
  budget: number;
  realise: number;
  ecart: number;
  pctConsomme: number;
  budgetId: string;
}

export interface BudgetComparatif {
  exercice: number;
  totalBudget: number;
  totalRealise: number;
  totalEcart: number;
  lignes: LigneComparatif[];
}

export interface BudgetUpsertRequest {
  compteNumero: string;
  montant: number;
  sens: SensBudget;
}
