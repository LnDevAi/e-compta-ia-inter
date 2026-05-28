import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

// ─── Modèle Document ─────────────────────────────────────────────────────────

class Document {
  final String id;
  final String nomFichier;
  final String? contentType;
  final int? taille;
  final String? uploadedBy;
  final DateTime? createdAt;
  final String typeEntite;

  Document({
    required this.id,
    required this.nomFichier,
    this.contentType,
    this.taille,
    this.uploadedBy,
    this.createdAt,
    required this.typeEntite,
  });

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id']?.toString() ?? '',
      nomFichier: json['nomFichier'] as String? ?? 'Document',
      contentType: json['contentType'] as String?,
      taille: json['taille'] as int?,
      uploadedBy: json['uploadedBy'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      typeEntite: json['typeEntite'] as String? ?? '',
    );
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

final documentsProvider =
    FutureProvider.autoDispose<List<Document>>((ref) async {
  final client = ref.watch(dioClientProvider);
  try {
    // Les documents dans ce backend sont liés à des entités
    // On interroge les pièces jointes de type ECRITURE pour exemple
    // En pratique l'API nécessite typeEntite + entiteId
    // On retourne une liste vide si pas d'entité connue
    return [];
  } catch (_) {
    return [];
  }
});

final uploadProgressProvider = StateProvider<double?>((ref) => null);

// ─── Écran Documents ─────────────────────────────────────────────────────────

class DocumentsScreen extends ConsumerStatefulWidget {
  const DocumentsScreen({super.key});

  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  bool _isUploading = false;
  String? _uploadError;
  String? _uploadSuccess;
  final List<Document> _localDocs = [];

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      type: FileType.custom,
      allowedExtensions: [
        'pdf', 'xlsx', 'xls', 'csv', 'doc', 'docx', 'txt', 'jpg', 'png'
      ],
      withData: true,
    );

    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;

    setState(() {
      _isUploading = true;
      _uploadError = null;
      _uploadSuccess = null;
    });

    try {
      // Sauvegarde locale temporaire pour visualisation
      if (file.bytes != null) {
        final dir = await getApplicationDocumentsDirectory();
        final localPath = '${dir.path}/${file.name}';
        await File(localPath).writeAsBytes(file.bytes!);

        final doc = Document(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          nomFichier: file.name,
          contentType: _guessContentType(file.extension ?? ''),
          taille: file.size,
          uploadedBy: 'Moi',
          createdAt: DateTime.now(),
          typeEntite: 'LOCAL',
        );

        setState(() {
          _localDocs.insert(0, doc);
          _uploadSuccess = '${file.name} ajouté avec succès';
          _isUploading = false;
        });
      } else {
        setState(() {
          _uploadError = 'Impossible de lire le fichier.';
          _isUploading = false;
        });
      }
    } catch (e) {
      setState(() {
        _uploadError = 'Erreur : $e';
        _isUploading = false;
      });
    }
  }

  Future<void> _downloadDocument(Document doc) async {
    try {
      final client = ref.read(dioClientProvider);
      final response = await client.dio.get(
        '/api/documents/${doc.id}/download',
        options: Options(responseType: ResponseType.bytes),
      );

      final bytes = response.data as List<int>;
      final dir = await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/${doc.nomFichier}';
      await File(filePath).writeAsBytes(bytes);
      await OpenFile.open(filePath);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  String _guessContentType(String ext) {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'xlsx':
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'csv':
        return 'text/csv';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  IconData _iconForContentType(String? ct) {
    if (ct == null) return Icons.insert_drive_file_outlined;
    if (ct.contains('pdf')) return Icons.picture_as_pdf_outlined;
    if (ct.contains('excel') || ct.contains('spreadsheet') || ct == 'text/csv') {
      return Icons.table_chart_outlined;
    }
    if (ct.contains('image')) return Icons.image_outlined;
    if (ct.contains('word')) return Icons.description_outlined;
    return Icons.insert_drive_file_outlined;
  }

  Color _colorForContentType(String? ct) {
    if (ct == null) return AppTheme.textSecondary;
    if (ct.contains('pdf')) return AppTheme.error;
    if (ct.contains('excel') || ct.contains('spreadsheet') || ct == 'text/csv') {
      return AppTheme.accent;
    }
    if (ct.contains('image')) return AppTheme.primaryLight;
    return AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    final fmtDate = DateFormat('dd/MM/yyyy HH:mm', 'fr_FR');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            tooltip: 'À propos',
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Gestion des documents'),
                  content: const Text(
                    'Cette section vous permet d\'importer et gérer '
                    'vos documents financiers (bilans, balances, '
                    'comptes de résultat) pour l\'analyse IA.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Fermer'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Zone d'upload
          InkWell(
            onTap: _isUploading ? null : _pickAndUpload,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.04),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppTheme.primary.withOpacity(0.2),
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  _isUploading
                      ? const CircularProgressIndicator()
                      : Icon(
                          Icons.cloud_upload_outlined,
                          size: 48,
                          color: AppTheme.primary.withOpacity(0.6),
                        ),
                  const SizedBox(height: 10),
                  Text(
                    _isUploading
                        ? 'Importation en cours...'
                        : 'Appuyez pour importer un document',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'PDF, Excel, CSV, Word, Images',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (_uploadError != null) ...[
            const SizedBox(height: 10),
            _StatusBanner(
              message: _uploadError!,
              color: AppTheme.error,
              icon: Icons.error_outline,
            ),
          ],
          if (_uploadSuccess != null) ...[
            const SizedBox(height: 10),
            _StatusBanner(
              message: _uploadSuccess!,
              color: AppTheme.accent,
              icon: Icons.check_circle_outline,
            ),
          ],

          const SizedBox(height: 20),

          // Types de documents rapides
          Text(
            'Documents recommandés',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _QuickDocType(
                label: 'Balance',
                icon: Icons.table_chart_outlined,
                color: AppTheme.accent,
                onTap: _pickAndUpload,
              ),
              const SizedBox(width: 8),
              _QuickDocType(
                label: 'Bilan',
                icon: Icons.account_balance_outlined,
                color: AppTheme.primary,
                onTap: _pickAndUpload,
              ),
              const SizedBox(width: 8),
              _QuickDocType(
                label: 'Résultat',
                icon: Icons.bar_chart_outlined,
                color: AppTheme.primaryLight,
                onTap: _pickAndUpload,
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Liste des documents importés
          if (_localDocs.isNotEmpty) ...[
            Text(
              'Mes documents (${_localDocs.length})',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            ..._localDocs.map(
              (doc) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _colorForContentType(doc.contentType)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _iconForContentType(doc.contentType),
                      color: _colorForContentType(doc.contentType),
                      size: 22,
                    ),
                  ),
                  title: Text(
                    doc.nomFichier,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (doc.taille != null)
                        Text(
                          _formatSize(doc.taille!),
                          style: const TextStyle(fontSize: 11),
                        ),
                      if (doc.createdAt != null)
                        Text(
                          fmtDate.format(doc.createdAt!),
                          style: const TextStyle(fontSize: 11),
                        ),
                    ],
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.download_outlined,
                        color: AppTheme.primary, size: 20),
                    onPressed: () => _downloadDocument(doc),
                    tooltip: 'Télécharger',
                  ),
                ),
              ),
            ),
          ] else ...[
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Icon(
                      Icons.folder_open_outlined,
                      size: 56,
                      color: AppTheme.textSecondary.withOpacity(0.5),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Aucun document importé',
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Importez vos documents financiers pour démarrer l\'analyse',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} Ko';
    }
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} Mo';
  }
}

class _QuickDocType extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickDocType({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: color.withOpacity(0.07),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  final String message;
  final Color color;
  final IconData icon;

  const _StatusBanner({
    required this.message,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
