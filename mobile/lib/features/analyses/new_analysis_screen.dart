import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import 'analyses_provider.dart';

class NewAnalysisScreen extends ConsumerStatefulWidget {
  const NewAnalysisScreen({super.key});

  @override
  ConsumerState<NewAnalysisScreen> createState() => _NewAnalysisScreenState();
}

class _NewAnalysisScreenState extends ConsumerState<NewAnalysisScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomSocieteCtrl = TextEditingController();
  int _selectedExercice = DateTime.now().year;
  PlatformFile? _bilanFile;
  PlatformFile? _compteResultatFile;
  PlatformFile? _balanceFile;
  bool _isLoading = false;
  String? _error;
  String? _successMessage;

  @override
  void dispose() {
    _nomSocieteCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String type) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'xlsx', 'xls', 'csv', 'txt'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() {
        switch (type) {
          case 'bilan':
            _bilanFile = result.files.first;
            break;
          case 'compte_resultat':
            _compteResultatFile = result.files.first;
            break;
          case 'balance':
            _balanceFile = result.files.first;
            break;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_bilanFile == null && _compteResultatFile == null && _balanceFile == null) {
      setState(() {
        _error = 'Veuillez importer au moins un document financier.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _successMessage = null;
    });

    try {
      final client = ref.read(dioClientProvider);

      // Import balance si fournie
      if (_balanceFile != null && _balanceFile!.bytes != null) {
        final formData = FormData.fromMap({
          'file': MultipartFile.fromBytes(
            _balanceFile!.bytes!,
            filename: _balanceFile!.name,
          ),
          'exercice': _selectedExercice,
        });
        await client.dio.post('/api/etats/import-balance', data: formData);
      }

      // Import bilan/compte résultat si fournis
      if (_bilanFile != null && _bilanFile!.bytes != null) {
        final formData = FormData.fromMap({
          'file': MultipartFile.fromBytes(
            _bilanFile!.bytes!,
            filename: _bilanFile!.name,
          ),
          'exercice': _selectedExercice,
        });
        await client.dio.post('/api/ia/analyser-facture', data: formData);
      }

      // Mettre à jour l'exercice sélectionné et rafraîchir les analyses
      ref.read(selectedExerciceProvider.notifier).state = _selectedExercice;
      ref.invalidate(analysesProvider(_selectedExercice));
      ref.invalidate(kpiProvider(_selectedExercice));

      setState(() {
        _successMessage =
            'Analyse lancée avec succès pour l\'exercice $_selectedExercice. '
            'Les ratios financiers ont été mis à jour.';
        _isLoading = false;
      });

      // Retour après succès
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.pop();
      }
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erreur lors de l\'analyse : $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle analyse'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête informatif
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppTheme.primary.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.lightbulb_outline,
                        color: AppTheme.primary, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Importez vos documents comptables pour générer '
                        'automatiquement les ratios et indicateurs financiers par IA.',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.primary,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text(
                'Informations générales',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),

              // Nom société (optionnel, pour référence)
              TextFormField(
                controller: _nomSocieteCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nom de la société (optionnel)',
                  prefixIcon: Icon(Icons.business_outlined),
                  hintText: 'Ex: SARL Exemple',
                ),
              ),
              const SizedBox(height: 16),

              // Sélection exercice
              DropdownButtonFormField<int>(
                value: _selectedExercice,
                decoration: const InputDecoration(
                  labelText: 'Exercice comptable',
                  prefixIcon: Icon(Icons.calendar_today_outlined),
                ),
                items: List.generate(5, (i) {
                  final y = DateTime.now().year - i;
                  return DropdownMenuItem(value: y, child: Text('$y'));
                }),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedExercice = v);
                },
              ),
              const SizedBox(height: 24),

              Text(
                'Documents financiers',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 6),
              Text(
                'Formats acceptés : PDF, Excel (XLSX/XLS), CSV',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(fontSize: 12),
              ),
              const SizedBox(height: 12),

              // Balance
              _FilePickerCard(
                label: 'Balance comptable',
                subtitle: 'Recommandé — import automatique',
                icon: Icons.table_chart_outlined,
                file: _balanceFile,
                required: true,
                onPick: () => _pickFile('balance'),
                onRemove: () => setState(() => _balanceFile = null),
              ),
              const SizedBox(height: 10),

              // Bilan
              _FilePickerCard(
                label: 'Bilan comptable',
                subtitle: 'Actif / Passif',
                icon: Icons.account_balance_outlined,
                file: _bilanFile,
                onPick: () => _pickFile('bilan'),
                onRemove: () => setState(() => _bilanFile = null),
              ),
              const SizedBox(height: 10),

              // Compte de résultat
              _FilePickerCard(
                label: 'Compte de résultat',
                subtitle: 'Produits / Charges',
                icon: Icons.bar_chart_outlined,
                file: _compteResultatFile,
                onPick: () => _pickFile('compte_resultat'),
                onRemove: () =>
                    setState(() => _compteResultatFile = null),
              ),
              const SizedBox(height: 24),

              // Erreur
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: AppTheme.error.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppTheme.error, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_error!,
                            style: const TextStyle(
                                color: AppTheme.error, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Succès
              if (_successMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.accent.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: AppTheme.accent.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline,
                          color: AppTheme.accent, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_successMessage!,
                            style: const TextStyle(
                                color: AppTheme.accentDark,
                                fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Bouton analyser
              SizedBox(
                height: 52,
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accent,
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.auto_awesome, color: Colors.white),
                  label: Text(
                    _isLoading
                        ? 'Analyse en cours...'
                        : 'Lancer l\'analyse IA',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilePickerCard extends StatelessWidget {
  final String label;
  final String subtitle;
  final IconData icon;
  final PlatformFile? file;
  final bool required;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _FilePickerCard({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.file,
    required this.onPick,
    required this.onRemove,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasFile = file != null;

    return InkWell(
      onTap: hasFile ? null : onPick,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: hasFile
              ? AppTheme.accent.withOpacity(0.05)
              : AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasFile
                ? AppTheme.accent.withOpacity(0.4)
                : AppTheme.divider,
            width: hasFile ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: hasFile
                    ? AppTheme.accent.withOpacity(0.1)
                    : AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                hasFile ? Icons.check_circle_outline : icon,
                color: hasFile ? AppTheme.accent : AppTheme.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      if (required) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppTheme.accent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Recommandé',
                            style: TextStyle(
                              color: AppTheme.accent,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    hasFile ? file!.name : subtitle,
                    style: TextStyle(
                      color: hasFile
                          ? AppTheme.accent
                          : AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (hasFile)
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                color: AppTheme.error,
                onPressed: onRemove,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              )
            else
              Icon(
                Icons.upload_file_outlined,
                color: AppTheme.primary.withOpacity(0.5),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
