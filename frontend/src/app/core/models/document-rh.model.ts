export type TypeDocument  = 'CONTRAT' | 'AVENANT' | 'ATTESTATION' | 'DIPLOME' | 'CNI' |
                             'PASSEPORT' | 'PERMIS_TRAVAIL' | 'CERTIFICAT_MEDICAL' | 'EVALUATION' | 'AUTRE';
export type StatutDocument = 'VALIDE' | 'EXPIRE' | 'ARCHIVE';

export interface DocumentRhResponse {
  id:                    string;
  collaborateurId:       string | null;
  collaborateurNom:      string | null;
  typeDocument:          TypeDocument;
  titre:                 string;
  description:           string | null;
  reference:             string | null;
  dateDocument:          string | null;
  dateExpiration:        string | null;
  statut:                StatutDocument;
  joursAvantExpiration:  number;
  createdAt:             string | null;
}

export interface DocumentRhRequest {
  collaborateurId?:  string;
  typeDocument:      TypeDocument;
  titre:             string;
  description?:      string;
  reference?:        string;
  dateDocument?:     string;
  dateExpiration?:   string;
}

export const TYPE_DOC_LABELS: Record<TypeDocument, string> = {
  CONTRAT:           'Contrat de travail',
  AVENANT:           'Avenant',
  ATTESTATION:       'Attestation de travail',
  DIPLOME:           'Diplôme',
  CNI:               'Carte nationale d\'identité',
  PASSEPORT:         'Passeport',
  PERMIS_TRAVAIL:    'Permis de travail',
  CERTIFICAT_MEDICAL:'Certificat médical',
  EVALUATION:        'Évaluation',
  AUTRE:             'Autre',
};

export const STATUT_DOC_LABELS: Record<StatutDocument, string> = {
  VALIDE:  'Valide',
  EXPIRE:  'Expiré',
  ARCHIVE: 'Archivé',
};
