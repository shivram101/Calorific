// lib/screens/settings_screen.dart
// Account settings — profile edit, activity/goal, logout, delete account.
// GET/PUT /api/profile, DELETE /api/account.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _saved = false;
  UserProfile? _profile;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  String _activityLevel = '';
  String _goal = '';

  static const activities = [
    'Sedentary',
    'Lightly active',
    'Active',
    'Very active'
  ];
  static const goals = [
    ('lose', 'Lose', '📉'),
    ('maintain', 'Maintain', '⚖️'),
    ('gain', 'Gain', '📈'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final profile = await getProfile();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _firstNameController.text = profile.firstName;
        _lastNameController.text = profile.lastName;
        _ageController.text = profile.age?.toString() ?? '';
        _heightController.text = profile.heightCm?.round().toString() ?? '';
        _weightController.text = profile.weightKg?.toString() ?? '';
        _activityLevel = profile.activityLevel ?? '';
        _goal = profile.goal ?? '';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSave() async {
    setState(() {
      _saving = true;
      _saved = false;
    });
    try {
      await updateProfile({
        'firstName': _firstNameController.text,
        'lastName': _lastNameController.text,
        if (_ageController.text.isNotEmpty)
          'age': int.tryParse(_ageController.text),
        if (_heightController.text.isNotEmpty)
          'heightCm': double.tryParse(_heightController.text),
        if (_weightController.text.isNotEmpty)
          'weightKg': double.tryParse(_weightController.text),
        if (_activityLevel.isNotEmpty) 'activityLevel': _activityLevel,
        if (_goal.isNotEmpty) 'goal': _goal,
      });
      setState(() => _saved = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(e.toString()),
            backgroundColor: CalorificColors.danger));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Log out')),
        ],
      ),
    );
    if (confirmed == true) {
      await logout();
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(context, '/login', (r) => false);
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete account'),
        content: const Text(
            'This will permanently delete your account and all your data. This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete',
                style: TextStyle(color: CalorificColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await deleteAccount();
        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(context, '/login', (r) => false);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(e.toString()),
              backgroundColor: CalorificColors.danger));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: CalorificColors.cream,
        body: Center(
            child: CircularProgressIndicator(color: CalorificColors.green)),
      );
    }

    return Scaffold(
      backgroundColor: CalorificColors.cream,
      appBar: AppBar(
        title: const Text('Settings',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          if (_saved)
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: CalorificColors.greenLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Text('Saved ✓',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: CalorificColors.greenDark)),
              ),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Account (read only)
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Account',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: CalorificColors.cream,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.mail_outline,
                          size: 16, color: CalorificColors.textMuted),
                      const SizedBox(width: 8),
                      Text(_profile?.email ?? '',
                          style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                if (_profile?.isVerified == true)
                  const Padding(
                    padding: EdgeInsets.only(top: 8, left: 4),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle,
                            size: 13, color: CalorificColors.green),
                        SizedBox(width: 4),
                        Text('Email verified',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: CalorificColors.green)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Profile
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Profile',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                        child:
                            _field('First name', _firstNameController, null)),
                    const SizedBox(width: 8),
                    Expanded(
                        child: _field('Last name', _lastNameController, null)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                        child: _field('Age', _ageController,
                            TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(
                        child: _field('Height (cm)', _heightController,
                            TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(
                        child: _field('Weight (kg)', _weightController,
                            TextInputType.number)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Activity level
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Activity level',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: activities
                      .map((a) => GestureDetector(
                            onTap: () =>
                                setState(() { _activityLevel = a; _saved = false; }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: _activityLevel == a
                                    ? CalorificColors.green
                                    : CalorificColors.cream,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(a,
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: _activityLevel == a
                                          ? Colors.white
                                          : CalorificColors.textMuted)),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Goal
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Goal',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: goals
                      .map((g) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: GestureDetector(
                                onTap: () =>
                                    setState(() { _goal = g.$1; _saved = false; }),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _goal == g.$1
                                        ? CalorificColors.green
                                        : CalorificColors.cream,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(g.$3,
                                          style:
                                              const TextStyle(fontSize: 18)),
                                      const SizedBox(height: 2),
                                      Text(g.$2,
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: _goal == g.$1
                                                  ? Colors.white
                                                  : CalorificColors
                                                      .textMuted)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: _saving ? null : _handleSave,
            child: Text(_saving ? 'Saving...' : 'Save changes'),
          ),
          const SizedBox(height: 12),

          // Logout
          OutlinedButton.icon(
            onPressed: _handleLogout,
            icon: const Icon(Icons.logout, size: 18),
            style: OutlinedButton.styleFrom(
              foregroundColor: CalorificColors.textDark,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            label: const Text('Log out'),
          ),
          const SizedBox(height: 16),

          // Danger zone
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFAEAEA)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Danger zone',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: CalorificColors.danger)),
                const SizedBox(height: 4),
                const Text(
                  'Permanently delete your account and all your data. This cannot be undone.',
                  style: TextStyle(
                      fontSize: 12, color: CalorificColors.textMuted),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _handleDelete,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CalorificColors.danger,
                      backgroundColor: CalorificColors.dangerLight,
                      side: const BorderSide(color: CalorificColors.danger),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Delete my account'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller,
      TextInputType? type) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: CalorificColors.textDark)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: type,
          onChanged: (_) => setState(() => _saved = false),
        ),
      ],
    );
  }

  Widget _card({required Widget child}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8),
          ],
        ),
        child: child,
      );

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }
}
