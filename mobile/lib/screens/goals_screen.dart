// lib/screens/goals_screen.dart
// Goals/targets screen with TDEE calculator (ported from Zack's RN version).
// Loads/saves via GET/PUT /api/targets, uses profile data for TDEE calc.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _saved = false;
  UserProfile? _profile;

  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        getTargets(),
        getProfile(),
      ]);
      final targets = results[0] as Targets?;
      final profile = results[1] as UserProfile;

      if (!mounted) return;
      setState(() {
        _profile = profile;
        if (targets != null) {
          _caloriesController.text = targets.calorieTarget.round().toString();
          _proteinController.text = targets.proteinTarget.round().toString();
          _carbsController.text = targets.carbTarget.round().toString();
          _fatController.text = targets.fatTarget.round().toString();
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Mifflin-St Jeor TDEE calculation using profile data
  void _calculateTDEE() {
    final p = _profile;
    if (p == null ||
        p.weightKg == null ||
        p.heightCm == null ||
        p.age == null ||
        p.sex == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text(
            'Complete your profile (age, sex, height, weight) in Settings first'),
      ));
      return;
    }

    // BMR — Mifflin-St Jeor
    double bmr = 10 * p.weightKg! + 6.25 * p.heightCm! - 5 * p.age!;
    bmr += (p.sex == 'Male') ? 5 : -161;

    // Activity multiplier
    const multipliers = {
      'Sedentary': 1.2,
      'Lightly active': 1.375,
      'Active': 1.55,
      'Very active': 1.725,
    };
    final tdee = bmr * (multipliers[p.activityLevel] ?? 1.2);

    // Goal adjustment
    double target = tdee;
    if (p.goal == 'lose') target -= 500;
    if (p.goal == 'gain') target += 300;

    // Macro split: 30% protein / 40% carbs / 30% fat
    final protein = (target * 0.30 / 4).round();
    final carbs = (target * 0.40 / 4).round();
    final fat = (target * 0.30 / 9).round();

    setState(() {
      _caloriesController.text = target.round().toString();
      _proteinController.text = protein.toString();
      _carbsController.text = carbs.toString();
      _fatController.text = fat.toString();
      _saved = false;
    });
  }

  Future<void> _handleSave() async {
    setState(() {
      _saving = true;
      _saved = false;
    });
    try {
      await setTargets(
        calorieTarget: double.tryParse(_caloriesController.text) ?? 0,
        proteinTarget: double.tryParse(_proteinController.text) ?? 0,
        carbTarget: double.tryParse(_carbsController.text) ?? 0,
        fatTarget: double.tryParse(_fatController.text) ?? 0,
      );
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: CalorificColors.cream,
        body: Center(
            child: CircularProgressIndicator(color: CalorificColors.green)),
      );
    }

    final cal = double.tryParse(_caloriesController.text) ?? 0;
    final pro = double.tryParse(_proteinController.text) ?? 0;
    final carb = double.tryParse(_carbsController.text) ?? 0;
    final fat = double.tryParse(_fatController.text) ?? 0;
    final macroCals = pro * 4 + carb * 4 + fat * 9;

    return Scaffold(
      backgroundColor: CalorificColors.cream,
      appBar: AppBar(
        title: const Text('Goals',
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
          // TDEE calculator card
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Calculate from profile',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text(
                  'Uses your age, sex, height, weight, activity level, and goal to estimate your daily targets (Mifflin-St Jeor).',
                  style: TextStyle(
                      fontSize: 12,
                      color: CalorificColors.textMuted,
                      height: 1.4),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _calculateTDEE,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: CalorificColors.green,
                      side: const BorderSide(color: CalorificColors.green),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Calculate my targets'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Calorie target
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily calorie target',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: _caloriesController,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() => _saved = false),
                  style: const TextStyle(
                      fontSize: 28, fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    hintText: '2200',
                    suffixText: 'kcal / day',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Macro targets
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Macro targets',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _macroField('Protein', _proteinController,
                    CalorificColors.protein, macroCals, 4),
                _macroField('Carbohydrates', _carbsController,
                    CalorificColors.carbs, macroCals, 4),
                _macroField(
                    'Fat', _fatController, CalorificColors.fat, macroCals, 9),
                if (macroCals > 0 && cal > 0 && (macroCals - cal).abs() > 50)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '⚠ Macros add up to ${macroCals.round()} kcal but calorie target is ${cal.round()} kcal',
                      style: const TextStyle(
                          fontSize: 11, color: CalorificColors.carbs),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          ElevatedButton(
            onPressed: _saving ? null : _handleSave,
            child: Text(_saving ? 'Saving...' : 'Save goals'),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _macroField(String label, TextEditingController controller,
      Color color, double macroCals, int mult) {
    final grams = double.tryParse(controller.text) ?? 0;
    final kcal = grams * mult;
    final pct = macroCals > 0 ? (kcal / macroCals * 100).round() : 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color)),
              Text('$pct% · ${kcal.round()} kcal',
                  style: const TextStyle(
                      fontSize: 11, color: CalorificColors.textMuted)),
            ],
          ),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() => _saved = false),
            decoration: InputDecoration(
              hintText: '0',
              suffixText: 'g',
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: color.withOpacity(0.4)),
              ),
            ),
          ),
        ],
      ),
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
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }
}
