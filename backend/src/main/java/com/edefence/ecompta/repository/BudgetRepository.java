package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(UUID entrepriseId, int exercice);

    Optional<Budget> findByEntrepriseIdAndExerciceAndCompteNumeroAndSens(
            UUID entrepriseId, int exercice, String compteNumero, Budget.Sens sens);

    Optional<Budget> findByIdAndEntrepriseId(UUID id, UUID entrepriseId);

    @Query("""
            SELECT DISTINCT b.exercice FROM Budget b
            WHERE b.entreprise.id = :eid
            ORDER BY b.exercice DESC
            """)
    List<Integer> findExercicesWithBudget(@Param("eid") UUID entrepriseId);
}
