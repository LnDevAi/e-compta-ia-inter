import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/api_client.dart';

// Modèles
class AuthState {
  final String? token;
  final UserProfile? profile;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.token,
    this.profile,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => token != null;

  AuthState copyWith({
    String? token,
    UserProfile? profile,
    bool? isLoading,
    String? error,
    bool clearToken = false,
    bool clearProfile = false,
    bool clearError = false,
  }) {
    return AuthState(
      token: clearToken ? null : token ?? this.token,
      profile: clearProfile ? null : profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class UserProfile {
  final String id;
  final String nom;
  final String email;
  final String role;
  final String entrepriseId;
  final String nomEntreprise;
  final String? pays;
  final String? plan;
  final String? typeEntite;

  UserProfile({
    required this.id,
    required this.nom,
    required this.email,
    required this.role,
    required this.entrepriseId,
    required this.nomEntreprise,
    this.pays,
    this.plan,
    this.typeEntite,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id']?.toString() ?? '',
      nom: json['nom'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
      entrepriseId: json['entrepriseId']?.toString() ?? '',
      nomEntreprise: json['nomEntreprise'] as String? ?? '',
      pays: json['pays'] as String?,
      plan: json['plan'] as String?,
      typeEntite: json['typeEntite'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nom': nom,
        'email': email,
        'role': role,
        'entrepriseId': entrepriseId,
        'nomEntreprise': nomEntreprise,
        'pays': pays,
        'plan': plan,
        'typeEntite': typeEntite,
      };
}

// Notifier
class AuthNotifier extends StateNotifier<AuthState> with ChangeNotifier {
  final DioClient _client;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._client, this._storage) : super(const AuthState()) {
    _tryRestoreSession();
  }

  Future<void> _tryRestoreSession() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await _storage.read(key: kTokenKey);
      if (token != null) {
        state = state.copyWith(token: token, isLoading: false);
        await _loadProfile();
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _client.dio.post(
        '/api/auth/login',
        data: {'email': email, 'motDePasse': password},
      );
      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String?;

      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Token manquant dans la réponse.',
        );
        return false;
      }

      await _storage.write(key: kTokenKey, value: token);
      state = state.copyWith(token: token, isLoading: false);
      await _loadProfile();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur de connexion inattendue.',
      );
      return false;
    }
  }

  Future<void> _loadProfile() async {
    try {
      final response = await _client.dio.get('/api/auth/me');
      final profile = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(profile: profile);
      notifyListeners();
    } catch (_) {
      // Profil optionnel, on ignore l'erreur
    }
  }

  Future<void> logout() async {
    try {
      final token = await _storage.read(key: kTokenKey);
      if (token != null) {
        await _client.dio.post('/api/auth/logout');
      }
    } catch (_) {
      // On se déconnecte localement même si le serveur échoue
    } finally {
      await _storage.delete(key: kTokenKey);
      state = const AuthState();
      notifyListeners();
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(dioClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(client, storage);
});
