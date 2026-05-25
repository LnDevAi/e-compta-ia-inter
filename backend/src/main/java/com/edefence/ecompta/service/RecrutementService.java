package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Candidature;
import com.edefence.ecompta.domain.Poste;
import com.edefence.ecompta.dto.notification.NotificationDto;
import com.edefence.ecompta.dto.recrutement.RecrutementDto;
import com.edefence.ecompta.repository.CandidatureRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.PosteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecrutementService {

    private final PosteRepository        posteRepo;
    private final CandidatureRepository  candidatureRepo;
    private final EntrepriseRepository   entrepriseRepo;
    private final NotificationService    notificationService;

    // ── Postes ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecrutementDto.PosteResponse> findAllPostes(UUID eid) {
        return posteRepo.findAllByEntreprise(eid).stream().map(p -> toPosteResponse(p, eid)).toList();
    }

    @Transactional(readOnly = true)
    public List<RecrutementDto.PosteResponse> findPostesOuverts(UUID eid) {
        return posteRepo.findOuverts(eid).stream().map(p -> toPosteResponse(p, eid)).toList();
    }

    @Transactional
    public RecrutementDto.PosteResponse createPoste(UUID eid, RecrutementDto.PosteSaveRequest req) {
        Poste p = Poste.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .titre(req.titre())
                .departement(req.departement())
                .description(req.description())
                .build();
        return toPosteResponse(posteRepo.save(p), eid);
    }

    @Transactional
    public RecrutementDto.PosteResponse updatePoste(UUID id, UUID eid, RecrutementDto.PosteSaveRequest req) {
        Poste p = findPosteOrThrow(id, eid);
        p.setTitre(req.titre());
        p.setDepartement(req.departement());
        p.setDescription(req.description());
        return toPosteResponse(posteRepo.save(p), eid);
    }

    @Transactional
    public RecrutementDto.PosteResponse changerStatutPoste(UUID id, UUID eid, Poste.Statut statut) {
        Poste p = findPosteOrThrow(id, eid);
        p.setStatut(statut);
        return toPosteResponse(posteRepo.save(p), eid);
    }

    @Transactional
    public void deletePoste(UUID id, UUID eid) {
        Poste p = findPosteOrThrow(id, eid);
        posteRepo.delete(p);
    }

    // ── Candidatures ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecrutementDto.CandidatureResponse> findCandidaturesByPoste(UUID eid, UUID pid) {
        return candidatureRepo.findByPoste(eid, pid).stream().map(this::toCandidatureResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RecrutementDto.CandidatureResponse> findAllCandidatures(UUID eid) {
        return candidatureRepo.findAllByEntreprise(eid).stream().map(this::toCandidatureResponse).toList();
    }

    @Transactional
    public RecrutementDto.CandidatureResponse createCandidature(UUID eid, RecrutementDto.CandidatureSaveRequest req) {
        Poste poste = findPosteOrThrow(req.posteId(), eid);
        if (poste.getStatut() != Poste.Statut.OUVERT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce poste n'est plus ouvert aux candidatures");
        }
        Candidature c = Candidature.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .poste(poste)
                .nomCandidat(req.nomCandidat())
                .email(req.email())
                .lienCv(req.lienCv())
                .note(req.note())
                .build();
        Candidature saved = candidatureRepo.save(c);
        notificationService.broadcast(eid, new NotificationDto(
                "RECRUTEMENT",
                "Nouvelle candidature de " + req.nomCandidat() + " pour le poste : " + poste.getTitre(),
                1, "INFO", "/dashboard/recrutement", Instant.now()));
        return toCandidatureResponse(saved);
    }

    @Transactional
    public RecrutementDto.CandidatureResponse avancerStatut(UUID id, UUID eid, RecrutementDto.CandidatureAvancerRequest req) {
        Candidature c = findCandidatureOrThrow(id, eid);
        Candidature.Statut next = switch (c.getStatut()) {
            case RECU         -> Candidature.Statut.EN_ENTRETIEN;
            case EN_ENTRETIEN -> Candidature.Statut.RETENU;
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Statut terminal : " + c.getStatut());
        };
        c.setStatut(next);
        if (req != null && req.note() != null) c.setNote(req.note());
        return toCandidatureResponse(candidatureRepo.save(c));
    }

    @Transactional
    public RecrutementDto.CandidatureResponse rejeter(UUID id, UUID eid, RecrutementDto.CandidatureAvancerRequest req) {
        Candidature c = findCandidatureOrThrow(id, eid);
        if (c.getStatut() == Candidature.Statut.RETENU || c.getStatut() == Candidature.Statut.REJETE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Statut terminal : " + c.getStatut());
        }
        c.setStatut(Candidature.Statut.REJETE);
        if (req != null && req.note() != null) c.setNote(req.note());
        return toCandidatureResponse(candidatureRepo.save(c));
    }

    @Transactional
    public void deleteCandidature(UUID id, UUID eid) {
        candidatureRepo.delete(findCandidatureOrThrow(id, eid));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Poste findPosteOrThrow(UUID id, UUID eid) {
        return posteRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Poste introuvable"));
    }

    private Candidature findCandidatureOrThrow(UUID id, UUID eid) {
        return candidatureRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Candidature introuvable"));
    }

    private RecrutementDto.PosteResponse toPosteResponse(Poste p, UUID eid) {
        long nb = candidatureRepo.countByPoste(eid, p.getId());
        return new RecrutementDto.PosteResponse(
                p.getId(), p.getTitre(), p.getDepartement(), p.getDescription(),
                p.getStatut(), p.getDateOuverture(), nb, p.getCreatedAt());
    }

    private RecrutementDto.CandidatureResponse toCandidatureResponse(Candidature c) {
        return new RecrutementDto.CandidatureResponse(
                c.getId(), c.getPoste().getId(), c.getPoste().getTitre(),
                c.getNomCandidat(), c.getEmail(), c.getLienCv(),
                c.getStatut(), c.getNote(), c.getCreatedAt());
    }
}
