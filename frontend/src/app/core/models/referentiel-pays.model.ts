export interface PaysResume {
  code:             string;
  nom:              string;
  devise:           string;
  systemeComptable: string;
}

export interface PaysDetail {
  code:                  string;
  nom:                   string;
  devise:                string;
  locale:                string;
  systemeComptable:      string;
  tauxTva:               number;
  tauxIs:                number;
  nomTva:                string | null;
  nomIs:                 string | null;
  minimumForfaitaire:    number;
  periodeDeclarationTva: string;
}
