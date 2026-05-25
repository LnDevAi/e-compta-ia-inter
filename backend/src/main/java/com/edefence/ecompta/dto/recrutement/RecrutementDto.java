package com.edefence.ecompta.dto.recrutement;

import com.edefence.ecompta.domain.Candidature;
import com.edefence.ecompta.domain.Poste;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class RecrutementDto {

    public record PosteSaveRequest(
            @NotBlank String titre,
            String departement,
            String description
    ) {}

    public record PosteResponse(
            UUID id,
            String titre,
            String departement,
            String description,
            Poste.Statut statut,
            LocalDate dateOuverture,
            long nbCandidatures,
            OffsetDateTime createdAt
    ) {}

    public record CandidatureSaveRequest(
            @NotNull UUID posteId,
            @NotBlank String nomCandidat,
            String email,
            String lienCv,
            String note
    ) {}

    public record CandidatureAvancerRequest(String note) {}

    public record CandidatureResponse(
            UUID id,
            UUID posteId,
            String posteTitre,
            String nomCandidat,
            String email,
            String lienCv,
            Candidature.Statut statut,
            String note,
            OffsetDateTime createdAt
    ) {}
}
