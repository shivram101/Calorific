// lib/screens/custom_food_screen.dart
// Create a custom food not in the USDA database.
// POST /api/foods/custom then navigates to food-detail to log it.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class CustomFoodScreen extends StatefulWidget {
  const CustomFoodScreen({super.key});

  @override
  State<CustomFoodScreen> createState() => _CustomFoodScreenState();
}

class _CustomFoodScreenState extends State<CustomFoodScreen> {
  final _nameController = TextEditingController();
  final _servingSizeController = TextEditingController(text: '1');
  final _servingUnitController = TextEditingController(text: 'serving');
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();
  bool _saving = false;

  double get _cal => double.tryParse(_caloriesController.text) ?? 0;
  double get _pro => double.tryParse(_proteinController.text) ?? 0;
  double get _carb => double.tryParse(_carbsController.text) ?? 0;
  double get _fat => double.tryParse(_fatController.text) ?? 0;
  double get _macroCals => _pro * 4 + _carb * 4 + _fat * 9;

  Future<void> _handleSave() async {
    if (_nameController.text.trim().isEmpty) {
      _showError('Please enter a food name');
      return;
    }
    if (_cal <= 0) {
      _showError('Please enter the calories');
      return;
    }

    setState(() => _saving = true);
    try {
      final food = await createCustomFood(
        name: _nameController.text.trim(),
        servingSize: double.tryParse(_servingSizeController.text) ?? 1,
        servingSizeUnit: _servingUnitController.text.trim().isEmpty
            ? 'serving'
            : _servingUnitController.text.trim(),
        calories: _cal,
        protein: _pro,
        carbs: _carb,
        fat: _fat,
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/food-detail',
          arguments: {'foodId': food.id});
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
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
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add food',
                style:
                    TextStyle(fontSize: 11, color: CalorificColors.textMuted)),
            Text('New Food',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Live preview
          if (_cal > 0)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FBF6),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_nameController.text.trim().isEmpty ? "New food" : _nameController.text.trim()} · ${_servingSizeController.text} ${_servingUnitController.text}',
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _previewStat('${_cal.round()}', 'kcal',
                          CalorificColors.green, 24),
                      _previewStat('${_pro.round()}g', 'protein',
                          CalorificColors.protein, 18),
                      _previewStat('${_carb.round()}g', 'carbs',
                          CalorificColors.carbs, 18),
                      _previewStat(
                          '${_fat.round()}g', 'fat', CalorificColors.fat, 18),
                    ],
                  ),
                  if (_macroCals > 0 && (_macroCals - _cal).abs() > 20)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        "⚠ Macro calories (${_macroCals.round()} kcal) don't quite match total — double check your numbers",
                        style: const TextStyle(
                            fontSize: 10, color: CalorificColors.carbs),
                      ),
                    ),
                ],
              ),
            ),

          // Food details card
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Food details',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _label('Food name *'),
                TextField(
                  controller: _nameController,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                      hintText: "e.g. Grandma's Chicken Soup"),
                ),
                const SizedBox(height: 16),
                _label('Serving size'),
                Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: TextField(
                        controller: _servingSizeController,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(hintText: '1'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _servingUnitController,
                        onChanged: (_) => setState(() {}),
                        decoration:
                            const InputDecoration(hintText: 'serving'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Nutrition card
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Nutrition per serving',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _nutrientField('Calories *', 'kcal', _caloriesController, null),
                _nutrientField(
                    'Protein', 'g', _proteinController, CalorificColors.protein),
                _nutrientField('Carbohydrates', 'g', _carbsController,
                    CalorificColors.carbs),
                _nutrientField('Fat', 'g', _fatController, CalorificColors.fat),
              ],
            ),
          ),
          const SizedBox(height: 100),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12),
          ],
        ),
        child: ElevatedButton(
          onPressed: _saving ? null : _handleSave,
          child: Text(_saving ? 'Saving...' : 'Save food & log it'),
        ),
      ),
    );
  }

  Widget _previewStat(
          String value, String label, Color color, double size) =>
      Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: size, fontWeight: FontWeight.bold, color: color)),
          Text(label,
              style: const TextStyle(
                  fontSize: 10, color: CalorificColors.textMuted)),
        ],
      );

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: CalorificColors.textDark)),
      );

  Widget _nutrientField(String label, String unit,
      TextEditingController controller, Color? color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label(label),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: '0',
              suffixText: unit,
              suffixStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color ?? CalorificColors.textMuted,
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
    _nameController.dispose();
    _servingSizeController.dispose();
    _servingUnitController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }
}
