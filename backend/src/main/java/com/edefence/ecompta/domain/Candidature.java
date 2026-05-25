package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "candidatures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "poste_id", nullable = false)
    private Poste poste;

    @Column(name = "nom_candidat", nullable = false, length = 200)
    private String nomCandidat;

    @Column(length = 200)
    private String email;

    @Column(name = "lien_cv", columnDefinition = "TEXT")
    private String lienCv;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.RECU;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { RECU, EN_ENTRETIEN, RETENU, REJETE }
}
