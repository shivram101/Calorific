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
  bool _isMetric = true;

  // Metric inputs (canonical units the API expects)
  final _ageController = TextEditingController();
  final _heightController = TextEditingController(); // cm
  final _weightController = TextEditingController(); // kg

  // Imperial inputs - kept separate so switching units doesn't clobber
  // whatever the person already typed.
  final _feetController = TextEditingController();
  final _inchesController = TextEditingController();
  final _lbsController = TextEditingController();

  String _activityLevel = '';
  String _goal = '';
  bool _submitting = false;

  static const double _cmPerInch = 2.54;
  static const double _kgPerLb = 0.45359237;

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

  // Canonical height in cm, computed from whichever unit is active — the
  // API and any algorithms only ever see this, never raw feet/inches.
  double? get _heightCm {
    if (_isMetric) return double.tryParse(_heightController.text);
    final feet = double.tryParse(_feetController.text) ?? 0;
    final inches = double.tryParse(_inchesController.text) ?? 0;
    if (feet == 0 && inches == 0) return null;
    return (feet * 12 + inches) * _cmPerInch;
  }

  // Canonical weight in kg, computed from whichever unit is active.
  double? get _weightKg {
    if (_isMetric) return double.tryParse(_weightController.text);
    final lbs = double.tryParse(_lbsController.text);
    if (lbs == null) return null;
    return lbs * _kgPerLb;
  }

  // Switches the displayed unit system, converting whatever the person has
  // already entered so nothing is lost (e.g. cm typed in, then they flip to
  // imperial - the feet/inches fields are pre-filled with the equivalent).
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
          var totalInches = (cm / _cmPerInch).round();
          var feet = totalInches ~/ 12;
          var inches = totalInches % 12;
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
        'heightCm': _heightCm,
        'weightKg': _weightKg,
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
          Expanded(
              child: _tile('Male', '♂️', _sex == 'Male',
                  () => setState(() => _sex = 'Male'))),
          const SizedBox(width: 12),
          Expanded(
              child: _tile('Female', '♀️', _sex == 'Female',
                  () => setState(() => _sex = 'Female'))),
        ],
      ),
      const SizedBox(height: 20),
      _label('Age'),
      TextField(
        controller: _ageController,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(hintText: '21'),
      ),
      const SizedBox(height: 20),
      _unitToggle(),
      const SizedBox(height: 20),
      _label(_isMetric ? 'Height (cm)' : 'Height'),
      if (_isMetric)
        TextField(
          controller: _heightController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(hintText: '175'),
        )
      else
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _feetController,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(hintText: '5', suffixText: 'ft'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _inchesController,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(hintText: '9', suffixText: 'in'),
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
          decoration: const InputDecoration(hintText: '70'),
        )
      else
        TextField(
          controller: _lbsController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(hintText: '154'),
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
    _feetController.dispose();
    _inchesController.dispose();
    _lbsController.dispose();
    super.dispose();
  }
}
