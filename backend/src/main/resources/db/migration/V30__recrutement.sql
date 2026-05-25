CREATE TABLE postes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    titre           VARCHAR(150) NOT NULL,
    departement     VARCHAR(100),
    description     TEXT,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'OUVERT',
    date_ouverture  DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_poste_statut CHECK (statut IN ('OUVERT','FERME','POURVUE'))
);

CREATE TABLE candidatures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    poste_id        UUID NOT NULL REFERENCES postes(id) ON DELETE CASCADE,
    nom_candidat    VARCHAR(200) NOT NULL,
    email           VARCHAR(200),
    lien_cv         TEXT,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'RECU',
    note            TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_candidature_statut CHECK (statut IN ('RECU','EN_ENTRETIEN','RETENU','REJETE'))
);
