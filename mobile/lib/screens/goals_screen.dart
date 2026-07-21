// lib/screens/goals_screen.dart
// Goals screen — fetches suggested targets from the backend API (Mifflin-St Jeor)
// and lets the user override macro values before saving.

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
  bool _calculating = false;
  bool _saving = false;
  bool _saved = false;
  String _selectedGoal = 'maintain';

  final _caloriesController = TextEditingController();
  final _proteinController  = TextEditingController();
  final _carbsController    = TextEditingController();
  final _fatController      = TextEditingController();

  static const goalOptions = [
    ('lose',     'Lose weight',  '🔻', Color(0xFFDC4C3F)),
    ('maintain', 'Maintain',     '⚖️', Color(0xFFEF9F27)),
    ('build',    'Build muscle', '💪', Color(0xFF1FA873)),
    ('gain',     'Gain weight',  '📈', Color(0xFF378ADD)),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([getTargets(), getProfile()]);
      final targets = results[0] as Targets?;
      final profile = results[1] as UserProfile;

      if (!mounted) return;
      setState(() {
        _selectedGoal = profile.goal ?? 'maintain';
        if (targets != null) {
          _caloriesController.text = targets.calorieTarget.round().toString();
          _proteinController.text  = targets.proteinTarget.round().toString();
          _carbsController.text    = targets.carbTarget.round().toString();
          _fatController.text      = targets.fatTarget.round().toString();
        }
        _loading = false;
      });

      // Auto-fetch suggested targets on load
      await _fetchSuggested(_selectedGoal, silent: true);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _fetchSuggested(String goalType, {bool silent = false}) async {
    if (!silent) setState(() => _calculating = true);
    try {
      // Save goal to profile first so the backend uses it in its calculation
      await updateProfile({'goal': goalType});
      final suggested = await getSuggestedTargets();
      if (!mounted) return;
      setState(() {
        _caloriesController.text = suggested.calorieTarget.round().toString();
        _proteinController.text  = suggested.proteinTarget.round().toString();
        _carbsController.text    = suggested.carbTarget.round().toString();
        _fatController.text      = suggested.fatTarget.round().toString();
        _saved = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.message.contains('biometrics')
              ? 'Complete your profile in Settings to get personalised targets'
              : e.toString()),
          backgroundColor: CalorificColors.danger,
        ));
      }
    } finally {
      if (mounted && !silent) setState(() => _calculating = false);
    }
  }

  Future<void> _handleSave() async {
    setState(() { _saving = true; _saved = false; });
    try {
      await setTargets(
        calorieTarget: double.tryParse(_caloriesController.text) ?? 0,
        proteinTarget: double.tryParse(_proteinController.text) ?? 0,
        carbTarget:    double.tryParse(_carbsController.text) ?? 0,
        fatTarget:     double.tryParse(_fatController.text) ?? 0,
      );
      setState(() => _saved = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: CalorificColors.danger,
        ));
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
        body: Center(child: CircularProgressIndicator(color: CalorificColors.green)),
      );
    }

    final cal  = double.tryParse(_caloriesController.text) ?? 0;
    final pro  = double.tryParse(_proteinController.text) ?? 0;
    final carb = double.tryParse(_carbsController.text) ?? 0;
    final fat  = double.tryParse(_fatController.text) ?? 0;
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

          // Goal selector
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Your goal',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Tap a goal to calculate personalised targets from your biometrics.',
                    style: TextStyle(fontSize: 12, color: CalorificColors.textMuted, height: 1.4)),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.4,
                  children: goalOptions.map((opt) {
                    final selected = _selectedGoal == opt.$1;
                    return GestureDetector(
                      onTap: _calculating ? null : () {
                        setState(() => _selectedGoal = opt.$1);
                        _fetchSuggested(opt.$1);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected ? opt.$4.withOpacity(0.12) : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected ? opt.$4 : const Color(0xFFF0EDE8),
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(opt.$3, style: const TextStyle(fontSize: 18)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(opt.$2,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: selected ? opt.$4 : CalorificColors.text,
                                  )),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                if (_calculating)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Row(
                      children: [
                        SizedBox(width: 14, height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: CalorificColors.green)),
                        SizedBox(width: 8),
                        Text('Calculating your targets…',
                            style: TextStyle(fontSize: 12, color: CalorificColors.textMuted)),
                      ],
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
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: _caloriesController,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() => _saved = false),
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
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
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _macroField('Protein',       _proteinController,  CalorificColors.protein, macroCals, 4),
                _macroField('Carbohydrates', _carbsController,    CalorificColors.carbs,   macroCals, 4),
                _macroField('Fat',           _fatController,      CalorificColors.fat,     macroCals, 9),
                if (macroCals > 0 && cal > 0 && (macroCals - cal).abs() > 50)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '⚠ Macros add up to ${macroCals.round()} kcal but calorie target is ${cal.round()} kcal',
                      style: const TextStyle(fontSize: 11, color: CalorificColors.carbs),
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
    final kcal  = grams * mult;
    final pct   = macroCals > 0 ? (kcal / macroCals * 100).round() : 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
              Text('$pct% · ${kcal.round()} kcal',
                  style: const TextStyle(fontSize: 11, color: CalorificColors.textMuted)),
            ],
          ),
          const SizedBox(height: 6),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct / 100.0,
              backgroundColor: color.withOpacity(0.12),
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 5,
            ),
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
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: color),
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
