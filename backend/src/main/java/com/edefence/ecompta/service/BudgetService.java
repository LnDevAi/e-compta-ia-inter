package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Budget;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.dto.budget.BudgetDto;
import com.edefence.ecompta.repository.BudgetRepository;
import com.edefence.ecompta.repository.CompteComptableRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository        budgetRepo;
    private final EntrepriseRepository    entrepriseRepo;
    private final CompteComptableRepository compteRepo;
    private final LigneEcritureRepository ligneRepo;

    // ─── Comparatif ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BudgetDto.Comparatif getComparatif(UUID entrepriseId, int exercice) {
        List<Budget> budgets = budgetRepo
                .findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(entrepriseId, exercice);

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);

        // Actual movements per account: numero -> [debit, credit]
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        Map<String, BigDecimal[]> actuals = balance.stream().collect(Collectors.toMap(
                row -> (String) row[0],
                row -> new BigDecimal[]{(BigDecimal) row[3], (BigDecimal) row[4]}
        ));

        // Account intitules
        Map<String, String> intitules = compteRepo
                .findByEntrepriseIdOrderByNumeroAsc(entrepriseId).stream()
                .collect(Collectors.toMap(c -> c.getNumero(), c -> c.getIntitule()));

        List<BudgetDto.LigneComparatif> lignes = new ArrayList<>();
        BigDecimal totalBudget  = BigDecimal.ZERO;
        BigDecimal totalRealise = BigDecimal.ZERO;

        for (Budget b : budgets) {
            BigDecimal[] mv = actuals.getOrDefault(b.getCompteNumero(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal realise = b.getSens() == Budget.Sens.DEBIT ? mv[0] : mv[1];
            BigDecimal ecart   = b.getMontant().subtract(realise);
            double pct = b.getMontant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                    : realise.multiply(BigDecimal.valueOf(100))
                             .divide(b.getMontant(), 1, RoundingMode.HALF_UP)
                             .doubleValue();

            lignes.add(new BudgetDto.LigneComparatif(
                    b.getCompteNumero(),
                    intitules.getOrDefault(b.getCompteNumero(), b.getCompteNumero()),
                    b.getSens().name(),
                    b.getMontant(), realise, ecart, pct, b.getId()
            ));
            totalBudget  = totalBudget.add(b.getMontant());
            totalRealise = totalRealise.add(realise);
        }

        return new BudgetDto.Comparatif(
                exercice, totalBudget, totalRealise,
                totalBudget.subtract(totalRealise), lignes);
    }

    @Transactional(readOnly = true)
    public List<Integer> exercicesWithBudget(UUID entrepriseId) {
        List<Integer> years = new ArrayList<>(budgetRepo.findExercicesWithBudget(entrepriseId));
        int current = LocalDate.now().getYear();
        if (!years.contains(current)) years.add(0, current);
        return years;
    }

    // ─── Upsert / Delete ─────────────────────────────────────────────────────

    @Transactional
    public BudgetDto.LigneComparatif upsert(UUID entrepriseId, int exercice, BudgetDto.UpsertRequest dto) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        if (!compteRepo.existsByNumeroAndEntrepriseId(dto.compteNumero(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Compte " + dto.compteNumero() + " introuvable dans le plan de comptes.");
        }

        Budget budget = budgetRepo
                .findByEntrepriseIdAndExerciceAndCompteNumeroAndSens(
                        entrepriseId, exercice, dto.compteNumero(), dto.sens())
                .orElseGet(() -> Budget.builder()
                        .entreprise(entreprise)
                        .exercice(exercice)
                        .compteNumero(dto.compteNumero())
                        .sens(dto.sens())
                        .build());

        budget.setMontant(dto.montant());
        budgetRepo.save(budget);

        String intitule = compteRepo.findByNumeroAndEntrepriseId(dto.compteNumero(), entrepriseId)
                .map(c -> c.getIntitule()).orElse(dto.compteNumero());

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        BigDecimal realise = balance.stream()
                .filter(row -> dto.compteNumero().equals(row[0]))
                .map(row -> dto.sens() == Budget.Sens.DEBIT ? (BigDecimal) row[3] : (BigDecimal) row[4])
                .findFirst().orElse(BigDecimal.ZERO);

        BigDecimal ecart = dto.montant().subtract(realise);
        double pct = dto.montant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : realise.multiply(BigDecimal.valueOf(100))
                         .divide(dto.montant(), 1, RoundingMode.HALF_UP).doubleValue();

        return new BudgetDto.LigneComparatif(
                dto.compteNumero(), intitule, dto.sens().name(),
                dto.montant(), realise, ecart, pct, budget.getId());
    }

    @Transactional
    public void delete(UUID id, UUID entrepriseId) {
        Budget b = budgetRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ligne budget introuvable"));
        budgetRepo.delete(b);
    }
}
