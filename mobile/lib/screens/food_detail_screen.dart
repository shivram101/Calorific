// lib/screens/food_detail_screen.dart
// Nutrition breakdown for a single food + quantity stepper + meal selector.
// Calls GET /api/foods/:id, logs via POST /api/logs.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class FoodDetailScreen extends StatefulWidget {
  final String foodId;
  final String? initialMeal;

  const FoodDetailScreen({super.key, required this.foodId, this.initialMeal});

  @override
  State<FoodDetailScreen> createState() => _FoodDetailScreenState();
}

class _FoodDetailScreenState extends State<FoodDetailScreen> {
  Food? _food;
  bool _loading = true;
  bool _adding = false;
  double _quantity = 1;
  late String _meal;

  static const meals = [
    ('breakfast', 'Breakfast', '☀️'),
    ('lunch', 'Lunch', '🌤️'),
    ('dinner', 'Dinner', '🌙'),
    ('snack', 'Snack', '🍎'),
  ];

  @override
  void initState() {
    super.initState();
    _meal = widget.initialMeal ?? 'breakfast';
    _load();
  }

  Future<void> _load() async {
    try {
      final food = await getFoodDetail(widget.foodId);
      if (mounted) setState(() { _food = food; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleAdd() async {
    if (_food == null) return;
    setState(() => _adding = true);
    try {
      await addLog(
        foodId: _food!.id,
        quantity: _quantity,
        meal: _meal,
        date: todayString(),
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(e.toString()),
            backgroundColor: CalorificColors.danger));
      }
    } finally {
      if (mounted) setState(() => _adding = false);
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

    if (_food == null) {
      return Scaffold(
        backgroundColor: CalorificColors.cream,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Food not found',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('← Go back',
                    style: TextStyle(color: CalorificColors.green)),
              ),
            ],
          ),
        ),
      );
    }

    final food = _food!;
    final cal = (food.calories * _quantity).round();
    final pro = (food.protein * _quantity * 10).round() / 10;
    final fat = (food.fat * _quantity * 10).round() / 10;
    final carb = (food.carbs * _quantity * 10).round() / 10;

    return Scaffold(
      backgroundColor: CalorificColors.cream,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(food.brand ?? 'Food detail',
                style: const TextStyle(
                    fontSize: 11, color: CalorificColors.textMuted)),
            Text(food.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Macro summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FBF6),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_quantity × ${food.servingSize.round()}${food.servingSizeUnit}',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600)),
                    Text('$cal kcal',
                        style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: CalorificColors.green)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _stat('Protein', '${pro}g', CalorificColors.protein),
                    _stat('Carbs', '${carb}g', CalorificColors.carbs),
                    _stat('Fat', '${fat}g', CalorificColors.fat),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Quantity stepper
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Serving size',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _stepBtn(Icons.remove, CalorificColors.cream,
                        CalorificColors.textDark, () {
                      setState(() =>
                          _quantity = (_quantity - 0.5).clamp(0.5, 99));
                    }),
                    Expanded(
                      child: Text(
                        '$_quantity servings',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    _stepBtn(Icons.add, CalorificColors.green, Colors.white,
                        () {
                      setState(() =>
                          _quantity = (_quantity + 0.5).clamp(0.5, 99));
                    }),
                  ],
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    '1 serving = ${food.servingSize.round()} ${food.servingSizeUnit}',
                    style: const TextStyle(
                        fontSize: 10, color: CalorificColors.textMuted),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Meal selector
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Add to meal',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: meals
                      .map((m) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              child: GestureDetector(
                                onTap: () => setState(() => _meal = m.$1),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _meal == m.$1
                                        ? CalorificColors.green
                                        : CalorificColors.cream,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(m.$3,
                                          style:
                                              const TextStyle(fontSize: 16)),
                                      const SizedBox(height: 2),
                                      Text(m.$2,
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: _meal == m.$1
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
          const SizedBox(height: 12),

          // Nutrition facts
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Nutrition facts',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text('Per $_quantity serving${_quantity != 1 ? "s" : ""}',
                    style: const TextStyle(
                        fontSize: 12, color: CalorificColors.textMuted)),
                const SizedBox(height: 8),
                _factRow('Calories', '$cal kcal', bold: true),
                _factRow('Protein', '${pro}g', color: CalorificColors.protein),
                _factRow('Carbohydrates', '${carb}g',
                    color: CalorificColors.carbs),
                _factRow('Fat', '${fat}g', color: CalorificColors.fat),
                if (food.source == 'fdc')
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Text('Source: USDA FoodData Central',
                        style: TextStyle(
                            fontSize: 9, color: CalorificColors.textFaint)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Micronutrients button
          GestureDetector(
            onTap: () => Navigator.pushNamed(
              context,
              '/micro-detail',
              arguments: {'foodId': food.id, 'foodName': food.name},
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withOpacity(0.05), blurRadius: 8),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: CalorificColors.greenLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.science_outlined,
                            size: 16, color: CalorificColors.green),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('View micronutrients',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: CalorificColors.textDark)),
                          Text('Vitamins, minerals, amino acids',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: CalorificColors.textMuted)),
                        ],
                      ),
                    ],
                  ),
                  const Icon(Icons.chevron_right,
                      color: CalorificColors.textMuted),
                ],
              ),
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
          onPressed: _adding ? null : _handleAdd,
          child: Text(_adding ? 'Adding...' : 'Add $cal kcal to $_meal'),
        ),
      ),
    );
  }

  Widget _stat(String label, String value, Color color) => Column(
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          Text(label,
              style: const TextStyle(
                  fontSize: 10, color: CalorificColors.textMuted)),
        ],
      );

  Widget _stepBtn(
          IconData icon, Color bg, Color fg, VoidCallback onTap) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
              color: bg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: fg, size: 20),
        ),
      );

  Widget _factRow(String label, String value,
      {bool bold = false, Color? color}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF5F3F0))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: bold ? FontWeight.bold : FontWeight.w500)),
          Text(value,
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color ?? CalorificColors.textDark)),
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
}
