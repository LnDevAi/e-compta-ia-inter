package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Poste;
import com.edefence.ecompta.dto.recrutement.RecrutementDto;
import com.edefence.ecompta.service.RecrutementService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recrutement")
@RequiredArgsConstructor
public class RecrutementController {

    private final RecrutementService svc;

    // ── Postes ───────────────────────────────────────────────────────────────

    @GetMapping("/postes")
    public List<RecrutementDto.PosteResponse> allPostes() {
        return svc.findAllPostes(TenantContext.get());
    }

    @GetMapping("/postes/ouverts")
    public List<RecrutementDto.PosteResponse> postesOuverts() {
        return svc.findPostesOuverts(TenantContext.get());
    }

    @PostMapping("/postes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PosteResponse createPoste(@Valid @RequestBody RecrutementDto.PosteSaveRequest req) {
        return svc.createPoste(TenantContext.get(), req);
    }

    @PutMapping("/postes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PosteResponse updatePoste(@PathVariable UUID id,
                                                    @Valid @RequestBody RecrutementDto.PosteSaveRequest req) {
        return svc.updatePoste(id, TenantContext.get(), req);
    }

    @PostMapping("/postes/{id}/fermer")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PosteResponse fermerPoste(@PathVariable UUID id) {
        return svc.changerStatutPoste(id, TenantContext.get(), Poste.Statut.FERME);
    }

    @PostMapping("/postes/{id}/rouvrir")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PosteResponse rouvrirPoste(@PathVariable UUID id) {
        return svc.changerStatutPoste(id, TenantContext.get(), Poste.Statut.OUVERT);
    }

    @PostMapping("/postes/{id}/pourvoir")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PosteResponse pourvoirPoste(@PathVariable UUID id) {
        return svc.changerStatutPoste(id, TenantContext.get(), Poste.Statut.POURVUE);
    }

    @DeleteMapping("/postes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePoste(@PathVariable UUID id) {
        svc.deletePoste(id, TenantContext.get());
    }

    // ── Candidatures ─────────────────────────────────────────────────────────

    @GetMapping("/candidatures")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public List<RecrutementDto.CandidatureResponse> allCandidatures() {
        return svc.findAllCandidatures(TenantContext.get());
    }

    @GetMapping("/postes/{pid}/candidatures")
    public List<RecrutementDto.CandidatureResponse> candidaturesPoste(@PathVariable UUID pid) {
        return svc.findCandidaturesByPoste(TenantContext.get(), pid);
    }

    @PostMapping("/candidatures")
    @ResponseStatus(HttpStatus.CREATED)
    public RecrutementDto.CandidatureResponse createCandidature(
            @Valid @RequestBody RecrutementDto.CandidatureSaveRequest req) {
        return svc.createCandidature(TenantContext.get(), req);
    }

    @PostMapping("/candidatures/{id}/avancer")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.CandidatureResponse avancer(
            @PathVariable UUID id,
            @RequestBody(required = false) RecrutementDto.CandidatureAvancerRequest req) {
        return svc.avancerStatut(id, TenantContext.get(), req);
    }

    @PostMapping("/candidatures/{id}/rejeter")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.CandidatureResponse rejeter(
            @PathVariable UUID id,
            @RequestBody(required = false) RecrutementDto.CandidatureAvancerRequest req) {
        return svc.rejeter(id, TenantContext.get(), req);
    }

    @DeleteMapping("/candidatures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCandidature(@PathVariable UUID id) {
        svc.deleteCandidature(id, TenantContext.get());
    }
}
