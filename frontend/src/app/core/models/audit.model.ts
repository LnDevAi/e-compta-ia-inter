export interface AuditEvent {
  id: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityRef: string | null;
  details: string | null;
  createdAt: string;
}

export interface AuditStats {
  totalEvents: number;
  eventsLast7Days: number;
  eventsLast30Days: number;
  topActions: { action: string; count: number }[];
  topUsers:   { userEmail: string; count: number }[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const ENTITY_TYPES = [
  'ECRITURE', 'BUDGET', 'FACTURE', 'DEVIS', 'TIERS',
  'TIERS_PAIEMENT', 'EXERCICE', 'LETTRAGE', 'ACADEMIE',
];

export const ENTITY_LABELS: Record<string, string> = {
  ECRITURE:        'Écriture comptable',
  BUDGET:          'Budget',
  FACTURE:         'Facture',
  DEVIS:           'Devis',
  TIERS:           'Tiers',
  TIERS_PAIEMENT:  'Paiement tiers',
  EXERCICE:        'Exercice',
  LETTRAGE:        'Lettrage',
  ACADEMIE:        'Académie',
};

export const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  {
    label: 'Comptabilité',
    actions: ['ECRITURE_CREEE', 'ECRITURE_VALIDEE', 'ECRITURE_SUPPRIMEE'],
  },
  {
    label: 'Budget',
    actions: ['BUDGET_CREE', 'BUDGET_MODIFIE', 'BUDGET_SUPPRIME'],
  },
  {
    label: 'Facturation',
    actions: ['FACTURE_CREEE', 'FACTURE_MODIFIEE', 'FACTURE_EMISE', 'FACTURE_SUPPRIMEE'],
  },
  {
    label: 'Tiers',
    actions: ['TIERS_CREE', 'TIERS_MODIFIE', 'TIERS_ACTIVE', 'TIERS_DESACTIVE', 'TIERS_SUPPRIME'],
  },
  {
    label: 'Clôture & Lettrage',
    actions: ['EXERCICE_CLOTURE', 'LETTRAGE_APPLIQUE', 'LETTRAGE_ANNULE'],
  },
];

export const ACTION_LABELS: Record<string, string> = {
  ECRITURE_CREEE:    'Écriture créée',
  ECRITURE_VALIDEE:  'Écriture validée',
  ECRITURE_SUPPRIMEE:'Écriture supprimée',
  BUDGET_CREE:       'Budget créé',
  BUDGET_MODIFIE:    'Budget modifié',
  BUDGET_SUPPRIME:   'Budget supprimé',
  FACTURE_CREEE:     'Facture créée',
  FACTURE_MODIFIEE:  'Facture modifiée',
  FACTURE_EMISE:     'Facture émise',
  FACTURE_SUPPRIMEE: 'Facture supprimée',
  TIERS_CREE:        'Tiers créé',
  TIERS_MODIFIE:     'Tiers modifié',
  TIERS_ACTIVE:      'Tiers activé',
  TIERS_DESACTIVE:   'Tiers désactivé',
  TIERS_SUPPRIME:    'Tiers supprimé',
  EXERCICE_CLOTURE:  'Exercice clôturé',
  LETTRAGE_APPLIQUE: 'Lettrage appliqué',
  LETTRAGE_ANNULE:   'Lettrage annulé',
};

export const ACTION_COLORS: Record<string, string> = {
  ECRITURE_CREEE:    'bg-blue-100 text-blue-700',
  ECRITURE_VALIDEE:  'bg-green-100 text-green-700',
  ECRITURE_SUPPRIMEE:'bg-red-100 text-red-700',
  BUDGET_CREE:       'bg-sky-100 text-sky-700',
  BUDGET_MODIFIE:    'bg-sky-100 text-sky-700',
  BUDGET_SUPPRIME:   'bg-red-100 text-red-700',
  FACTURE_CREEE:     'bg-indigo-100 text-indigo-700',
  FACTURE_MODIFIEE:  'bg-indigo-100 text-indigo-700',
  FACTURE_EMISE:     'bg-violet-100 text-violet-700',
  FACTURE_SUPPRIMEE: 'bg-red-100 text-red-700',
  TIERS_CREE:        'bg-teal-100 text-teal-700',
  TIERS_MODIFIE:     'bg-teal-100 text-teal-700',
  TIERS_ACTIVE:      'bg-emerald-100 text-emerald-700',
  TIERS_DESACTIVE:   'bg-orange-100 text-orange-700',
  TIERS_SUPPRIME:    'bg-red-100 text-red-700',
  EXERCICE_CLOTURE:  'bg-purple-100 text-purple-700',
  LETTRAGE_APPLIQUE: 'bg-cyan-100 text-cyan-700',
  LETTRAGE_ANNULE:   'bg-amber-100 text-amber-700',
};
