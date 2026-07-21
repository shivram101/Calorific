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
  bool _isMetric = true;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _ageController = TextEditingController();
  final _heightController = TextEditingController(); // cm
  final _weightController = TextEditingController(); // kg

  // Imperial inputs — kept separate so switching units doesn't clobber
  // whatever the person already typed.
  final _feetController = TextEditingController();
  final _inchesController = TextEditingController();
  final _lbsController = TextEditingController();

  String _activityLevel = '';
  String _goal = '';

  static const double _cmPerInch = 2.54;
  static const double _kgPerLb = 0.45359237;

  // Each tuple: (apiValue, displayLabel, icon)
  static const activities = [
    ('sedentary',  'Sedentary',    '🛋️'),
    ('light',      'Light',        '🚶'),
    ('moderate',   'Moderate',     '🏃'),
    ('active',     'Active',       '⚡'),
    ('veryActive', 'Very active',  '🏆'),
  ];
  static const goals = [
    ('lose',     'Lose weight',  '🔻'),
    ('maintain', 'Maintain',     '⚖️'),
    ('build',    'Build muscle', '💪'),
    ('gain',     'Gain weight',  '📈'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  // Canonical height in cm, computed from whichever unit is active — the
  // API only ever sees this, never raw feet/inches.
  double? get _heightCm {
    if (_isMetric) {
      return _heightController.text.isEmpty
          ? null
          : double.tryParse(_heightController.text);
    }
    final feet = double.tryParse(_feetController.text) ?? 0;
    final inches = double.tryParse(_inchesController.text) ?? 0;
    if (feet == 0 && inches == 0) return null;
    return (feet * 12 + inches) * _cmPerInch;
  }

  // Canonical weight in kg, computed from whichever unit is active.
  double? get _weightKg {
    if (_isMetric) {
      return _weightController.text.isEmpty
          ? null
          : double.tryParse(_weightController.text);
    }
    final lbs = double.tryParse(_lbsController.text);
    if (lbs == null) return null;
    return lbs * _kgPerLb;
  }

  // Switches the displayed unit system, converting whatever the person has
  // already entered so nothing is lost.
  void _setUnitSystem(bool metric) {
    if (metric == _isMetric) return;
    setState(() {
      if (metric) {
        final feet = double.tryParse(_feetController.text) ?? 0;
        final inches = double.tryParse(_inchesController.text) ?? 0;
        if (feet > 0 || inches > 0) {
          final cm = (feet * 12 + inches) * _cmPerInch;
          _heightController.text = cm.round().toString();
        }
        final lbs = double.tryParse(_lbsController.text);
        if (lbs != null) {
          _weightController.text = (lbs * _kgPerLb).toStringAsFixed(1);
        }
      } else {
        final cm = double.tryParse(_heightController.text);
        if (cm != null) {
          final totalInches = (cm / _cmPerInch).round();
          final feet = totalInches ~/ 12;
          final inches = totalInches % 12;
          _feetController.text = feet.toString();
          _inchesController.text = inches.toString();
        }
        final kg = double.tryParse(_weightController.text);
        if (kg != null) {
          _lbsController.text = (kg / _kgPerLb).toStringAsFixed(1);
        }
      }
      _isMetric = metric;
    });
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
        if (_heightCm != null) 'heightCm': _heightCm,
        if (_weightKg != null) 'weightKg': _weightKg,
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
    await logout();
    if (mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (r) => false);
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
                _field('Age', _ageController, TextInputType.number),
                const SizedBox(height: 16),
                _unitToggle(),
                const SizedBox(height: 16),
                _label(_isMetric ? 'Height (cm)' : 'Height'),
                if (_isMetric)
                  TextField(
                    controller: _heightController,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() => _saved = false),
                    decoration: const InputDecoration(hintText: '175'),
                  )
                else
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _feetController,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setState(() => _saved = false),
                          decoration: const InputDecoration(
                              hintText: '5', suffixText: 'ft'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _inchesController,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setState(() => _saved = false),
                          decoration: const InputDecoration(
                              hintText: '9', suffixText: 'in'),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 16),
                _label(_isMetric ? 'Weight (kg)' : 'Weight (lbs)'),
                if (_isMetric)
                  TextField(
                    controller: _weightController,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() => _saved = false),
                    decoration: const InputDecoration(hintText: '70'),
                  )
                else
                  TextField(
                    controller: _lbsController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setState(() => _saved = false),
                    decoration: const InputDecoration(hintText: '154'),
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
                      .map((rec) {
                        final apiVal = rec.$1;
                        final label  = rec.$2;
                        final icon   = rec.$3;
                        final active = _activityLevel == apiVal;
                        return GestureDetector(
                          onTap: () => setState(() {
                            _activityLevel = apiVal;
                            _saved = false;
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: active
                                  ? CalorificColors.green
                                  : CalorificColors.cream,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: active
                                    ? CalorificColors.green
                                    : Colors.transparent,
                              ),
                            ),
                            child: Text('$icon $label',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: active
                                        ? Colors.white
                                        : CalorificColors.textMuted)),
                          ),
                        );
                      })
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
                                onTap: () => setState(() {
                                  _goal = g.$1;
                                  _saved = false;
                                }),
                                child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _goal == g.$1
                                        ? CalorificColors.green
                                        : CalorificColors.cream,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(g.$3,
                                          style: const TextStyle(fontSize: 18)),
                                      const SizedBox(height: 2),
                                      Text(g.$2,
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: _goal == g.$1
                                                  ? Colors.white
                                                  : CalorificColors.textMuted)),
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
                  style:
                      TextStyle(fontSize: 12, color: CalorificColors.textMuted),
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

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: CalorificColors.textDark)),
      );

  // Metric / Imperial segmented toggle — governs both height and weight
  // fields below it so the person only has to pick a system once.
  Widget _unitToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: CalorificColors.cream,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(child: _unitOption('Metric', true)),
          Expanded(child: _unitOption('Imperial', false)),
        ],
      ),
    );
  }

  Widget _unitOption(String label, bool metric) {
    final selected = _isMetric == metric;
    return GestureDetector(
      onTap: () => _setUnitSystem(metric),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? CalorificColors.green : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : CalorificColors.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _field(
      String label, TextEditingController controller, TextInputType? type) {
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
    _feetController.dispose();
    _inchesController.dispose();
    _lbsController.dispose();
    super.dispose();
  }
}
