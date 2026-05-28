import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import 'analyses_provider.dart';

class AnalysesListScreen extends ConsumerWidget {
  const AnalysesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exercice = ref.watch(selectedExerciceProvider);
    final analyseAsync = ref.watch(analysesProvider(exercice));
    final currentYear = DateTime.now().year;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analyses financières'),
        actions: [
          // Sélecteur d'exercice
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: exercice,
                dropdownColor: AppTheme.primary,
                style:
                    const TextStyle(color: Colors.white, fontSize: 14),
                icon: const Icon(Icons.keyboard_arrow_down,
                    color: Colors.white),
                items: List.generate(5, (i) {
                  final y = currentYear - i;
                  return DropdownMenuItem(
                    value: y,
                    child: Text('Exercice $y',
                        style:
                            const TextStyle(color: Colors.white)),
                  );
                }),
                onChanged: (v) {
                  if (v != null) {
                    ref
                        .read(selectedExerciceProvider.notifier)
                        .state = v;
                  }
                },
              ),
            ),
          ),
        ],
      ),
      body: analyseAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(analysesProvider(exercice)),
        ),
        data: (analyse) => _AnalysesContent(
          analyse: analyse,
          exercice: exercice,
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/analyses/new'),
        backgroundColor: AppTheme.accent,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Nouvelle analyse',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _AnalysesContent extends StatelessWidget {
  final AnalyseFinanciere analyse;
  final int exercice;

  const _AnalysesContent({
    required this.analyse,
    required this.exercice,
  });

  @override
  Widget build(BuildContext context) {
    final fmtMoney = NumberFormat('#,##0', 'fr_FR');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Carte récapitulative
        Card(
          color: AppTheme.primary,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.bar_chart,
                        color: Colors.white70, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Exercice $exercice',
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Score de santé financière',
                          style: TextStyle(
                              color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${analyse.scoreGlobal}/100',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    _ScoreBadge(score: analyse.scoreGlobal),
                  ],
                ),
                const SizedBox(height: 16),
                // Barre de progression
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: analyse.scoreGlobal / 100,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.colorForScore(analyse.scoreGlobal),
                    ),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Données clés
        Text(
          'Données financières clés',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        Card(
          child: Column(
            children: [
              _DataRow(
                label: 'Total actif',
                valeur: analyse.totalActif,
                fmt: fmtMoney,
                icon: Icons.account_balance_outlined,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: "Chiffre d'affaires",
                valeur: analyse.chiffreAffaires,
                fmt: fmtMoney,
                icon: Icons.trending_up,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: 'Résultat net',
                valeur: analyse.resultatNet,
                fmt: fmtMoney,
                icon: Icons.account_balance_wallet_outlined,
                isResultat: true,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: 'Capitaux propres',
                valeur: analyse.capitauxPropres,
                fmt: fmtMoney,
                icon: Icons.corporate_fare_outlined,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: 'FRNG',
                valeur: analyse.frng,
                fmt: fmtMoney,
                icon: Icons.sync_alt,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: 'BFR',
                valeur: analyse.bfr,
                fmt: fmtMoney,
                icon: Icons.swap_horiz,
              ),
              const Divider(height: 1, indent: 56),
              _DataRow(
                label: 'Trésorerie nette',
                valeur: analyse.tresorerieNette,
                fmt: fmtMoney,
                icon: Icons.savings_outlined,
                isResultat: true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Scores par groupe
        Text(
          'Scores par catégorie',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        ...analyse.scoresGroupes.entries.map(
          (e) => _GroupeScoreCard(
            titre: e.key,
            score: e.value,
            scoreN1: analyse.scoresGroupesN1[e.key],
          ),
        ),
        const SizedBox(height: 16),

        // Bouton voir détails
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: () => context.push('/analyses/$exercice'),
            icon: const Icon(Icons.analytics_outlined),
            label: const Text('Voir l\'analyse détaillée'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 50,
          child: OutlinedButton.icon(
            onPressed: () => context.push('/analyses/$exercice/report'),
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Rapport complet'),
          ),
        ),
        const SizedBox(height: 80),
      ],
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  final int score;
  const _ScoreBadge({required this.score});

  String get _label {
    if (score >= 70) return 'SOLIDE';
    if (score >= 40) return 'MOYEN';
    return 'FRAGILE';
  }

  Color get _color => AppTheme.colorForScore(score);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withOpacity(0.5)),
      ),
      child: Text(
        _label,
        style: TextStyle(
          color: _color,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _DataRow extends StatelessWidget {
  final String label;
  final double? valeur;
  final NumberFormat fmt;
  final IconData icon;
  final bool isResultat;

  const _DataRow({
    required this.label,
    required this.valeur,
    required this.fmt,
    required this.icon,
    this.isResultat = false,
  });

  @override
  Widget build(BuildContext context) {
    Color valueColor = AppTheme.textPrimary;
    if (isResultat && valeur != null) {
      valueColor = valeur! >= 0 ? AppTheme.accent : AppTheme.error;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primary.withOpacity(0.6)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                  ),
            ),
          ),
          Text(
            valeur != null ? '${fmt.format(valeur)} FCFA' : '—',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupeScoreCard extends StatelessWidget {
  final String titre;
  final int score;
  final int? scoreN1;

  const _GroupeScoreCard({
    required this.titre,
    required this.score,
    this.scoreN1,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.colorForScore(score);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$score',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titre,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (scoreN1 != null)
                    Text(
                      'N-1 : $scoreN1/100',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                width: 80,
                child: LinearProgressIndicator(
                  value: score / 100,
                  backgroundColor: color.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  minHeight: 8,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined,
                size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            Text(
              'Données indisponibles',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}
