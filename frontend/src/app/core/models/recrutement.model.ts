export type StatutPoste       = 'OUVERT' | 'FERME' | 'POURVUE';
export type StatutCandidature = 'RECU' | 'EN_ENTRETIEN' | 'RETENU' | 'REJETE';

export interface PosteResponse {
  id:             string;
  titre:          string;
  departement:    string | null;
  description:    string | null;
  statut:         StatutPoste;
  dateOuverture:  string;
  nbCandidatures: number;
  createdAt:      string;
}

export interface CandidatureResponse {
  id:          string;
  posteId:     string;
  posteTitre:  string;
  nomCandidat: string;
  email:       string | null;
  lienCv:      string | null;
  statut:      StatutCandidature;
  note:        string | null;
  createdAt:   string;
}

export interface PosteSaveRequest {
  titre:       string;
  departement: string | null;
  description: string | null;
}

export interface CandidatureSaveRequest {
  posteId:     string;
  nomCandidat: string;
  email:       string | null;
  lienCv:      string | null;
  note:        string | null;
}

export interface CandidatureAvancerRequest {
  note: string | null;
}
