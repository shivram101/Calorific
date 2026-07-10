// lib/screens/onboarding_screen.dart
// 3-step onboarding: body stats → activity level → goal.
// Saves to PUT /api/profile then navigates to diary.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 1;
  String _sex = '';
  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  String _activityLevel = '';
  String _goal = '';
  bool _submitting = false;

  static const activities = [
    ('Sedentary', '🛋️'),
    ('Lightly active', '🚶'),
    ('Active', '🏃'),
    ('Very active', '🏋️'),
  ];

  static const goals = [
    ('lose', 'Lose', '📉'),
    ('maintain', 'Maintain', '⚖️'),
    ('gain', 'Gain', '📈'),
  ];

  Future<void> _handleFinish() async {
    if (_activityLevel.isEmpty || _goal.isEmpty) {
      _showError('Please select an activity level and goal');
      return;
    }

    setState(() => _submitting = true);
    try {
      await updateProfile({
        'sex': _sex,
        'age': int.tryParse(_ageController.text),
        'heightCm': double.tryParse(_heightController.text),
        'weightKg': double.tryParse(_weightController.text),
        'activityLevel': _activityLevel,
        'goal': _goal,
      });
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/diary');
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: CalorificColors.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CalorificColors.cream,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),

              // Progress bar
              Row(
                children: List.generate(3, (i) {
                  return Expanded(
                    child: Container(
                      height: 6,
                      margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                      decoration: BoxDecoration(
                        color: (i + 1) <= _step
                            ? CalorificColors.green
                            : const Color(0xFFF0E9DA),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              if (_step == 1) ..._buildStep1(),
              if (_step == 2) ..._buildStep2(),
              if (_step == 3) ..._buildStep3(),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildStep1() {
    return [
      _title('Your body stats', 'Step 1 of 3'),
      const SizedBox(height: 24),
      _label('Sex'),
      Row(
        children: [
          Expanded(child: _tile('Male', '♂️', _sex == 'Male', () => setState(() => _sex = 'Male'))),
          const SizedBox(width: 12),
          Expanded(child: _tile('Female', '♀️', _sex == 'Female', () => setState(() => _sex = 'Female'))),
        ],
      ),
      const SizedBox(height: 20),
      _label('Age'),
      TextField(
        controller: _ageController,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(hintText: '21'),
      ),
      const SizedBox(height: 16),
      _label('Height (cm)'),
      TextField(
        controller: _heightController,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(hintText: '175'),
      ),
      const SizedBox(height: 16),
      _label('Weight (kg)'),
      TextField(
        controller: _weightController,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(hintText: '70'),
      ),
      const SizedBox(height: 32),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () => setState(() => _step = 2),
          child: const Text('Continue'),
        ),
      ),
    ];
  }

  List<Widget> _buildStep2() {
    return [
      _title('Activity level', 'Step 2 of 3'),
      const SizedBox(height: 24),
      ...activities.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GestureDetector(
              onTap: () => setState(() => _activityLevel = a.$1),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _activityLevel == a.$1
                      ? CalorificColors.green
                      : CalorificColors.cream,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Text(a.$2, style: const TextStyle(fontSize: 18)),
                    const SizedBox(width: 12),
                    Text(
                      a.$1,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _activityLevel == a.$1
                            ? Colors.white
                            : CalorificColors.textDark,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() => _step = 1),
              child: const Text('Back'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () => setState(() => _step = 3),
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildStep3() {
    return [
      _title('Your goal', 'Step 3 of 3'),
      const SizedBox(height: 24),
      Row(
        children: goals
            .map((g) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: _tile(g.$2, g.$3, _goal == g.$1,
                        () => setState(() => _goal = g.$1)),
                  ),
                ))
            .toList(),
      ),
      const SizedBox(height: 32),
      Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() => _step = 2),
              child: const Text('Back'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _submitting ? null : _handleFinish,
              child: Text(_submitting ? 'Saving...' : 'Finish'),
            ),
          ),
        ],
      ),
    ];
  }

  Widget _title(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: CalorificColors.textDark)),
        const SizedBox(height: 4),
        Text(subtitle,
            style: const TextStyle(
                fontSize: 14, color: CalorificColors.textMuted)),
      ],
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: CalorificColors.textDark)),
      );

  Widget _tile(String label, String icon, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: active ? CalorificColors.green : CalorificColors.cream,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 6),
            Text(label,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: active ? Colors.white : CalorificColors.textDark)),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    super.dispose();
  }
}
