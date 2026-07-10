// home_shell.dart — the bottom tab bar (Diary / Trends / Goals / Settings).
// The app's spine: Zack's tab-bar design, required by the plan.
// Wave 1 ships the shell with placeholder tabs; each wave replaces one.

import 'package:flutter/material.dart';
import '../api/client.dart' as api;
import '../theme.dart';
import 'login_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Diary', 'Trends', 'Goals', 'Settings'];

  Future<void> _logout() async {
    await api.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        title: Text(_titles[_index],
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout, color: AppColors.muted, size: 20),
            tooltip: 'Log out',
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          _PlaceholderTab(label: 'Diary'),
          _PlaceholderTab(label: 'Trends'),
          _PlaceholderTab(label: 'Goals'),
          _PlaceholderTab(label: 'Settings'),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryTint,
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book, color: AppColors.primary),
              label: 'Diary'),
          NavigationDestination(
              icon: Icon(Icons.trending_up_outlined),
              selectedIcon: Icon(Icons.trending_up, color: AppColors.primary),
              label: 'Trends'),
          NavigationDestination(
              icon: Icon(Icons.flag_outlined),
              selectedIcon: Icon(Icons.flag, color: AppColors.primary),
              label: 'Goals'),
          NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon: Icon(Icons.settings, color: AppColors.primary),
              label: 'Settings'),
        ],
      ),
    );
  }
}

/// Wave-1 placeholder — replaced screen by screen as the port proceeds.
class _PlaceholderTab extends StatelessWidget {
  final String label;
  const _PlaceholderTab({required this.label});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(24),
        decoration: cardDecoration(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.construction, color: AppColors.warning, size: 32),
            const SizedBox(height: 10),
            Text('$label — port in progress',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 4),
            const Text('The React Native version is the spec.',
                style: TextStyle(color: AppColors.muted, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
