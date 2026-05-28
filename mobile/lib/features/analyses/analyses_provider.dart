import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

// ─── Modèles ──────────────────────────────────────────────────────────────────

class RatioFinancier {
  final String code;
  final String libelle;
  final String formule;
  final double? valeur;
  final String? interpretation;
  final String niveau; // BON | MOYEN | FAIBLE | INFO
  final double? valeurN1;
  final double evolutionPct;

  RatioFinancier({
    required this.code,
    required this.libelle,
    required this.formule,
    this.valeur,
    this.interpretation,
    required this.niveau,
    this.valeurN1,
    required this.evolutionPct,
  });

  factory RatioFinancier.fromJson(Map<String, dynamic> json) {
    return RatioFinancier(
      code: json['code'] as String? ?? '',
      libelle: json['libelle'] as String? ?? '',
      formule: json['formule'] as String? ?? '',
      valeur: (json['valeur'] as num?)?.toDouble(),
      interpretation: json['interpretation'] as String?,
      niveau: json['niveau'] as String? ?? 'INFO',
      valeurN1: (json['valeurN1'] as num?)?.toDouble(),
      evolutionPct: (json['evolutionPct'] as num?)?.toDouble() ?? 0,
    );
  }
}

class GroupeRatios {
  final String titre;
  final List<RatioFinancier> ratios;

  GroupeRatios({required this.titre, required this.ratios});

  factory GroupeRatios.fromJson(Map<String, dynamic> json) {
    return GroupeRatios(
      titre: json['titre'] as String? ?? '',
      ratios: (json['ratios'] as List<dynamic>? ?? [])
          .map((r) => RatioFinancier.fromJson(r as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AnalyseFinanciere {
  final int exercice;
  final List<GroupeRatios> groupes;
  final double? totalActif;
  final double? chiffreAffaires;
  final double? resultatNet;
  final double? capitauxPropres;
  final double? dettesFinancieres;
  final double? frng;
  final double? bfr;
  final double? tresorerieNette;
  final int scoreGlobal;
  final Map<String, int> scoresGroupes;
  final Map<String, int> scoresGroupesN1;

  AnalyseFinanciere({
    required this.exercice,
    required this.groupes,
    this.totalActif,
    this.chiffreAffaires,
    this.resultatNet,
    this.capitauxPropres,
    this.dettesFinancieres,
    this.frng,
    this.bfr,
    this.tresorerieNette,
    required this.scoreGlobal,
    required this.scoresGroupes,
    required this.scoresGroupesN1,
  });

  factory AnalyseFinanciere.fromJson(Map<String, dynamic> json) {
    return AnalyseFinanciere(
      exercice: json['exercice'] as int? ?? 0,
      groupes: (json['groupes'] as List<dynamic>? ?? [])
          .map((g) => GroupeRatios.fromJson(g as Map<String, dynamic>))
          .toList(),
      totalActif: (json['totalActif'] as num?)?.toDouble(),
      chiffreAffaires: (json['chiffreAffaires'] as num?)?.toDouble(),
      resultatNet: (json['resultatNet'] as num?)?.toDouble(),
      capitauxPropres: (json['capitauxPropres'] as num?)?.toDouble(),
      dettesFinancieres: (json['dettesFinancieres'] as num?)?.toDouble(),
      frng: (json['frng'] as num?)?.toDouble(),
      bfr: (json['bfr'] as num?)?.toDouble(),
      tresorerieNette: (json['tresorerieNette'] as num?)?.toDouble(),
      scoreGlobal: json['scoreGlobal'] as int? ?? 0,
      scoresGroupes: (json['scoresGroupes'] as Map<String, dynamic>? ?? {})
          .map((k, v) => MapEntry(k, v as int)),
      scoresGroupesN1: (json['scoresGroupesN1'] as Map<String, dynamic>? ?? {})
          .map((k, v) => MapEntry(k, v as int)),
    );
  }
}

class KpiExecutif {
  final int exercice;
  final KpiCard? ca;
  final KpiCard? charges;
  final KpiCard? resultatNet;
  final KpiCard? tresorerie;
  final List<MoisData> tendanceMensuelle;
  final List<Alerte> alertes;
  final RatiosResume? ratios;

  KpiExecutif({
    required this.exercice,
    this.ca,
    this.charges,
    this.resultatNet,
    this.tresorerie,
    required this.tendanceMensuelle,
    required this.alertes,
    this.ratios,
  });

  factory KpiExecutif.fromJson(Map<String, dynamic> json) {
    return KpiExecutif(
      exercice: json['exercice'] as int? ?? 0,
      ca: json['ca'] != null
          ? KpiCard.fromJson(json['ca'] as Map<String, dynamic>)
          : null,
      charges: json['charges'] != null
          ? KpiCard.fromJson(json['charges'] as Map<String, dynamic>)
          : null,
      resultatNet: json['resultatNet'] != null
          ? KpiCard.fromJson(json['resultatNet'] as Map<String, dynamic>)
          : null,
      tresorerie: json['tresorerie'] != null
          ? KpiCard.fromJson(json['tresorerie'] as Map<String, dynamic>)
          : null,
      tendanceMensuelle:
          (json['tendanceMensuelle'] as List<dynamic>? ?? [])
              .map((m) => MoisData.fromJson(m as Map<String, dynamic>))
              .toList(),
      alertes: (json['alertes'] as List<dynamic>? ?? [])
          .map((a) => Alerte.fromJson(a as Map<String, dynamic>))
          .toList(),
      ratios: json['ratios'] != null
          ? RatiosResume.fromJson(json['ratios'] as Map<String, dynamic>)
          : null,
    );
  }
}

class KpiCard {
  final String label;
  final double? valeur;
  final double? precedent;
  final double evolutionPct;
  final String tendance;
  final String? unite;

  KpiCard({
    required this.label,
    this.valeur,
    this.precedent,
    required this.evolutionPct,
    required this.tendance,
    this.unite,
  });

  factory KpiCard.fromJson(Map<String, dynamic> json) {
    return KpiCard(
      label: json['label'] as String? ?? '',
      valeur: (json['valeur'] as num?)?.toDouble(),
      precedent: (json['precedent'] as num?)?.toDouble(),
      evolutionPct: (json['evolutionPct'] as num?)?.toDouble() ?? 0,
      tendance: json['tendance'] as String? ?? 'STABLE',
      unite: json['unite'] as String?,
    );
  }
}

class MoisData {
  final int mois;
  final String label;
  final double ca;
  final double charges;
  final double resultat;

  MoisData({
    required this.mois,
    required this.label,
    required this.ca,
    required this.charges,
    required this.resultat,
  });

  factory MoisData.fromJson(Map<String, dynamic> json) {
    return MoisData(
      mois: json['mois'] as int? ?? 0,
      label: json['label'] as String? ?? '',
      ca: (json['ca'] as num?)?.toDouble() ?? 0,
      charges: (json['charges'] as num?)?.toDouble() ?? 0,
      resultat: (json['resultat'] as num?)?.toDouble() ?? 0,
    );
  }
}

class Alerte {
  final String niveau; // DANGER | WARNING | INFO
  final String message;

  Alerte({required this.niveau, required this.message});

  factory Alerte.fromJson(Map<String, dynamic> json) {
    return Alerte(
      niveau: json['niveau'] as String? ?? 'INFO',
      message: json['message'] as String? ?? '',
    );
  }
}

class RatiosResume {
  final double margeNettePct;
  final double tauxChargesPct;
  final double dso;
  final double tauxVariationCa;

  RatiosResume({
    required this.margeNettePct,
    required this.tauxChargesPct,
    required this.dso,
    required this.tauxVariationCa,
  });

  factory RatiosResume.fromJson(Map<String, dynamic> json) {
    return RatiosResume(
      margeNettePct: (json['margeNettePct'] as num?)?.toDouble() ?? 0,
      tauxChargesPct: (json['tauxChargesPct'] as num?)?.toDouble() ?? 0,
      dso: (json['dso'] as num?)?.toDouble() ?? 0,
      tauxVariationCa: (json['tauxVariationCa'] as num?)?.toDouble() ?? 0,
    );
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────

final analysesProvider =
    FutureProvider.family<AnalyseFinanciere, int>((ref, exercice) async {
  final client = ref.watch(dioClientProvider);
  try {
    final response = await client.dio.get(
      '/api/ratios',
      queryParameters: {'exercice': exercice},
    );
    return AnalyseFinanciere.fromJson(response.data as Map<String, dynamic>);
  } on ApiException {
    rethrow;
  } catch (e) {
    throw ApiException('Erreur lors du chargement de l\'analyse: $e');
  }
});

final kpiProvider = FutureProvider.family<KpiExecutif, int>((ref, exercice) async {
  final client = ref.watch(dioClientProvider);
  try {
    final response = await client.dio.get(
      '/api/kpi-executif',
      queryParameters: {'exercice': exercice},
    );
    return KpiExecutif.fromJson(response.data as Map<String, dynamic>);
  } on ApiException {
    rethrow;
  } catch (e) {
    throw ApiException('Erreur lors du chargement des KPIs: $e');
  }
});

// Provider pour l'exercice courant sélectionné
final selectedExerciceProvider = StateProvider<int>((ref) {
  return DateTime.now().year;
});
