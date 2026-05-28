import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import 'analyses_provider.dart';

class AnalysisDetailScreen extends ConsumerWidget {
  final String analysisId;
  const AnalysisDetailScreen({super.key, required this.analysisId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exercice = int.tryParse(analysisId) ??
        ref.watch(selectedExerciceProvider);
    final analyseAsync = ref.watch(analysesProvider(exercice));

    return Scaffold(
      appBar: AppBar(
        title: Text('Analyse $exercice'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            tooltip: 'Rapport complet',
            onPressed: () =>
                context.push('/analyses/$analysisId/report'),
          ),
        ],
      ),
      body: analyseAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(analysesProvider(exercice)),
        ),
        data: (analyse) => _DetailContent(analyse: analyse),
      ),
    );
  }
}

class _DetailContent extends StatelessWidget {
  final AnalyseFinanciere analyse;
  const _DetailContent({required this.analyse});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: analyse.groupes.length + 1,
      child: Column(
        children: [
          // Score global en en-tête
          _ScoreHeader(analyse: analyse),

          // Onglets
          Container(
            color: Colors.white,
            child: TabBar(
              isScrollable: true,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textSecondary,
              indicatorColor: AppTheme.primary,
              tabAlignment: TabAlignment.start,
              tabs: [
                const Tab(text: 'Vue globale'),
                ...analyse.groupes.map((g) => Tab(text: g.titre)),
              ],
            ),
          ),

          // Contenu des onglets
          Expanded(
            child: TabBarView(
              children: [
                _VueGlobaleTab(analyse: analyse),
                ...analyse.groupes
                    .map((g) => _GroupeTab(groupe: g)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ScoreHeader extends StatelessWidget {
  final AnalyseFinanciere analyse;
  const _ScoreHeader({required this.analyse});

  @override
  Widget build(BuildContext context) {
    final scoreColor = AppTheme.colorForScore(analyse.scoreGlobal);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: AppTheme.primary,
      ),
      child: Row(
        children: [
          CircularPercentIndicator(
            radius: 40,
            lineWidth: 8,
            percent: analyse.scoreGlobal / 100,
            center: Text(
              '${analyse.scoreGlobal}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            progressColor: scoreColor,
            backgroundColor: Colors.white24,
            circularStrokeCap: CircularStrokeCap.round,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Score de santé financière',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  _scoreLabel(analyse.scoreGlobal),
                  style: TextStyle(
                    color: scoreColor,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Exercice ${analyse.exercice}',
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _scoreLabel(int score) {
    if (score >= 70) return 'Santé financière solide';
    if (score >= 40) return 'Situation moyenne';
    return 'Situation fragile';
  }
}

class _VueGlobaleTab extends StatelessWidget {
  final AnalyseFinanciere analyse;
  const _VueGlobaleTab({required this.analyse});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Scores par catégorie',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        // Radar-like bar chart des scores
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SizedBox(
                  height: 200,
                  child: _ScoresBarChart(
                    scoresGroupes: analyse.scoresGroupes,
                    scoresGroupesN1: analyse.scoresGroupesN1,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Jauges principales
        Text('Indicateurs clés',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _JaugeCard(
              label: 'Liquidité',
              description: 'FRNG / BFR',
              valeur: analyse.frng != null && analyse.bfr != null && analyse.bfr! != 0
                  ? analyse.frng! / analyse.bfr!
                  : null,
              max: 3,
              unite: 'x',
              seuils: const [1.0, 1.5],
            ),
            _JaugeCard(
              label: 'Autonomie',
              description: 'Capitaux propres / Total actif',
              valeur: analyse.capitauxPropres != null &&
                      analyse.totalActif != null &&
                      analyse.totalActif! != 0
                  ? (analyse.capitauxPropres! / analyse.totalActif! * 100)
                  : null,
              max: 100,
              unite: '%',
              seuils: const [20, 50],
            ),
            _JaugeCard(
              label: 'Rentabilité nette',
              description: 'Résultat net / CA',
              valeur: analyse.resultatNet != null &&
                      analyse.chiffreAffaires != null &&
                      analyse.chiffreAffaires! != 0
                  ? (analyse.resultatNet! / analyse.chiffreAffaires! * 100)
                  : null,
              max: 20,
              unite: '%',
              seuils: const [2, 8],
            ),
          ],
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}

class _GroupeTab extends StatelessWidget {
  final GroupeRatios groupe;
  const _GroupeTab({required this.groupe});

  @override
  Widget build(BuildContext context) {
    final fmtPct = NumberFormat('#,##0.##', 'fr_FR');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...groupe.ratios.map(
          (ratio) => _RatioCard(ratio: ratio, fmtPct: fmtPct),
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}

class _RatioCard extends StatelessWidget {
  final RatioFinancier ratio;
  final NumberFormat fmtPct;

  const _RatioCard({required this.ratio, required this.fmtPct});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.colorForNiveau(ratio.niveau);
    final hasN1 = ratio.valeurN1 != null;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Text(
                    ratio.libelle,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                _NiveauBadge(niveau: ratio.niveau),
              ],
            ),
            const SizedBox(height: 6),

            // Formule
            Text(
              ratio.formule,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 12),

            // Valeur principale
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Valeur N',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                    Text(
                      ratio.valeur != null
                          ? fmtPct.format(ratio.valeur)
                          : '—',
                      style: TextStyle(
                        color: color,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (hasN1) ...[
                  const SizedBox(width: 24),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Valeur N-1',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                      Text(
                        fmtPct.format(ratio.valeurN1),
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  // Évolution
                  _EvolutionBadge(pct: ratio.evolutionPct),
                ],
              ],
            ),

            // Interprétation
            if (ratio.interpretation != null &&
                ratio.interpretation!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, color: color, size: 15),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        ratio.interpretation!,
                        style: TextStyle(
                          color: color.withOpacity(0.9),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NiveauBadge extends StatelessWidget {
  final String niveau;
  const _NiveauBadge({required this.niveau});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.colorForNiveau(niveau);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        niveau,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EvolutionBadge extends StatelessWidget {
  final double pct;
  const _EvolutionBadge({required this.pct});

  @override
  Widget build(BuildContext context) {
    final isPositive = pct >= 0;
    final color =
        isPositive ? AppTheme.accent : AppTheme.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPositive ? Icons.arrow_upward : Icons.arrow_downward,
            color: color,
            size: 12,
          ),
          const SizedBox(width: 2),
          Text(
            '${pct.abs().toStringAsFixed(1)}%',
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScoresBarChart extends StatelessWidget {
  final Map<String, int> scoresGroupes;
  final Map<String, int> scoresGroupesN1;

  const _ScoresBarChart({
    required this.scoresGroupes,
    required this.scoresGroupesN1,
  });

  @override
  Widget build(BuildContext context) {
    final keys = scoresGroupes.keys.toList();
    final barGroups = <BarChartGroupData>[];

    for (int i = 0; i < keys.length; i++) {
      final key = keys[i];
      final score = scoresGroupes[key] ?? 0;
      final scoreN1 = scoresGroupesN1[key];

      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: score.toDouble(),
              color: AppTheme.colorForScore(score),
              width: scoreN1 != null ? 12 : 20,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            if (scoreN1 != null)
              BarChartRodData(
                toY: scoreN1.toDouble(),
                color: AppTheme.textSecondary.withOpacity(0.4),
                width: 12,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(4)),
              ),
          ],
        ),
      );
    }

    return BarChart(
      BarChartData(
        maxY: 100,
        barGroups: barGroups,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => const FlLine(
            color: AppTheme.divider,
            strokeWidth: 1,
          ),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              getTitlesWidget: (value, meta) {
                if (value % 25 != 0) return const SizedBox.shrink();
                return Text(
                  '${value.toInt()}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textSecondary,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final i = value.toInt();
                if (i < 0 || i >= keys.length) {
                  return const SizedBox.shrink();
                }
                final parts = keys[i].split(' ');
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    parts.first.length > 8
                        ? '${parts.first.substring(0, 7)}.'
                        : parts.first,
                    style: const TextStyle(
                      fontSize: 9,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            tooltipRoundedRadius: 8,
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final key = keys[groupIndex];
              final label = rodIndex == 0 ? 'N' : 'N-1';
              return BarTooltipItem(
                '$key\n$label: ${rod.toY.toInt()}/100',
                TextStyle(
                  color: rod.color,
                  fontSize: 11,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _JaugeCard extends StatelessWidget {
  final String label;
  final String description;
  final double? valeur;
  final double max;
  final String unite;
  final List<double> seuils; // [seuil_faible, seuil_bon]

  const _JaugeCard({
    required this.label,
    required this.description,
    required this.valeur,
    required this.max,
    required this.unite,
    required this.seuils,
  });

  Color _colorForValeur(double? v) {
    if (v == null) return AppTheme.textSecondary;
    if (v >= seuils[1]) return AppTheme.niveauBon;
    if (v >= seuils[0]) return AppTheme.niveauMoyen;
    return AppTheme.niveauFaible;
  }

  @override
  Widget build(BuildContext context) {
    final color = _colorForValeur(valeur);
    final percent = valeur != null
        ? (valeur!.clamp(0, max) / max).clamp(0.0, 1.0)
        : 0.0;

    return SizedBox(
      width: (MediaQuery.of(context).size.width - 44) / 2,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              CircularPercentIndicator(
                radius: 45,
                lineWidth: 10,
                percent: percent,
                center: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      valeur != null
                          ? '${valeur!.toStringAsFixed(1)}$unite'
                          : '—',
                      style: TextStyle(
                        color: color,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                progressColor: color,
                backgroundColor: color.withOpacity(0.1),
                circularStrokeCap: CircularStrokeCap.round,
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
              Text(
                description,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 10,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
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
            const Icon(Icons.error_outline,
                size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            Text(message,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center),
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
