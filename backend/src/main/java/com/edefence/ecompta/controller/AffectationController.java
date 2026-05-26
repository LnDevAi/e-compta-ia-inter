package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.affectation.AffectationDto;
import com.edefence.ecompta.service.AffectationService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/affectation")
@RequiredArgsConstructor
public class AffectationController {

    private final AffectationService svc;

    @GetMapping("/{exercice}")
    public AffectationDto.InfoResultat getInfo(@PathVariable int exercice) {
        return svc.getInfo(TenantContext.get(), exercice);
    }

    @PostMapping("/{exercice}")
    public AffectationDto.AffectationResponse affecter(
            @PathVariable int exercice,
            @RequestBody AffectationDto.AffectationRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return svc.affecter(TenantContext.get(), exercice, request, user.getUsername());
    }
}
