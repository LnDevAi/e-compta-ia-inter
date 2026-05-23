package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.EcritureComptable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface EcritureComptableRepository extends JpaRepository<EcritureComptable, UUID> {

    @Query("""
            SELECT e FROM EcritureComptable e
            WHERE e.entreprise.id = :entrepriseId
            AND (:journal IS NULL OR e.journal = :journal)
            AND (:statut  IS NULL OR e.statut  = :statut)
            AND (:from    IS NULL OR e.dateEcriture >= :from)
            AND (:to      IS NULL OR e.dateEcriture <= :to)
            ORDER BY e.dateEcriture DESC, e.createdAt DESC
            """)
    Page<EcritureComptable> findWithFilters(
            @Param("entrepriseId") UUID entrepriseId,
            @Param("journal") EcritureComptable.Journal journal,
            @Param("statut") EcritureComptable.Statut statut,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    boolean existsByNumeroPieceAndEntrepriseId(String numeroPiece, UUID entrepriseId);

    long countByEntrepriseId(UUID entrepriseId);

    @Query("SELECT COUNT(e) FROM EcritureComptable e WHERE e.entreprise.id = :id AND e.statut = 'BROUILLON'")
    long countBrouillonsByEntrepriseId(@Param("id") UUID entrepriseId);

    @Query("SELECT COUNT(e) FROM EcritureComptable e WHERE e.entreprise.id = :id AND e.statut = 'VALIDEE'")
    long countValideesByEntrepriseId(@Param("id") UUID entrepriseId);
}
