package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Poste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PosteRepository extends JpaRepository<Poste, UUID> {

    @Query("SELECT p FROM Poste p WHERE p.entreprise.id = :eid ORDER BY p.createdAt DESC")
    List<Poste> findAllByEntreprise(@Param("eid") UUID eid);

    @Query("SELECT p FROM Poste p WHERE p.entreprise.id = :eid AND p.statut = 'OUVERT' ORDER BY p.dateOuverture DESC")
    List<Poste> findOuverts(@Param("eid") UUID eid);

    @Query("SELECT p FROM Poste p WHERE p.id = :id AND p.entreprise.id = :eid")
    Optional<Poste> findByIdAndEntreprise(@Param("id") UUID id, @Param("eid") UUID eid);
}
