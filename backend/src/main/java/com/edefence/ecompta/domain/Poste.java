package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "postes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Poste {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(length = 100)
    private String departement;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.OUVERT;

    @Column(name = "date_ouverture", nullable = false)
    @Builder.Default
    private LocalDate dateOuverture = LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { OUVERT, FERME, POURVUE }
}
