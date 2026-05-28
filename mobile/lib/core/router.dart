import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/analyses/analyses_list_screen.dart';
import '../features/analyses/new_analysis_screen.dart';
import '../features/analyses/analysis_detail_screen.dart';
import '../features/analyses/report_screen.dart';
import '../features/documents/documents_screen.dart';
import '../features/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authProvider.notifier);
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isLoggedIn = authState.token != null;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !isGoingToLogin) {
        return '/login';
      }
      if (isLoggedIn && isGoingToLogin) {
        return '/dashboard';
      }
      return null;
    },
    refreshListenable: authNotifier,
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return DashboardShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            builder: (context, state) => const DashboardTab(),
          ),
          GoRoute(
            path: '/analyses',
            name: 'analyses',
            builder: (context, state) => const AnalysesListScreen(),
            routes: [
              GoRoute(
                path: 'new',
                name: 'new-analysis',
                builder: (context, state) => const NewAnalysisScreen(),
              ),
              GoRoute(
                path: ':id',
                name: 'analysis-detail',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return AnalysisDetailScreen(analysisId: id);
                },
                routes: [
                  GoRoute(
                    path: 'report',
                    name: 'report',
                    builder: (context, state) {
                      final id = state.pathParameters['id']!;
                      return ReportScreen(exercice: int.tryParse(id) ?? 0);
                    },
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/documents',
            name: 'documents',
            builder: (context, state) => const DocumentsScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Page introuvable')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Page introuvable: ${state.uri}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Retour à l\'accueil'),
            ),
          ],
        ),
      ),
    ),
  );
});
