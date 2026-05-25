export type DecisionApprobation = 'APPROUVEE' | 'REJETEE';

export interface EcritureEnAttenteResume {
  id:          string;
  numeroPiece: string;
  dateEcriture: string;
  libelle:     string;
  journal:     string;
  auteurId:    string;
  auteurNom:   string;
  soumisAt:    string;
}

export interface ApprobationResponse {
  id:              string;
  decision:        DecisionApprobation;
  commentaire:     string | null;
  approbateurId:   string;
  approbateurNom:  string;
  createdAt:       string;
}

export interface DecisionRequest {
  decision:    DecisionApprobation;
  commentaire: string | null;
}
