// lib/screens/food_detail_screen.dart
// Nutrition breakdown for a single food + quantity stepper + meal selector.
// Calls GET /api/foods/:id, logs via POST /api/logs.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  // Quantity stepper state
  late final TextEditingController _qtyController;
  final FocusNode _qtyFocusNode = FocusNode();
  Timer? _holdTimer;
  static const List<double> _qtyPresets = [0.5, 1, 1.5, 2, 2.5, 3];

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
    _qtyController = TextEditingController(text: _formatQty(_quantity));
    _qtyFocusNode.addListener(() {
      if (!_qtyFocusNode.hasFocus) _commitQtyText();
    });
    _load();
  }

  @override
  void dispose() {
    _qtyController.dispose();
    _qtyFocusNode.dispose();
    _holdTimer?.cancel();
    super.dispose();
  }

  // Formats a serving quantity without trailing zeros, e.g. 1.5 -> "1.5", 2.0 -> "2".
  String _formatQty(double q) {
    if (q == q.roundToDouble()) return q.round().toString();
    var s = q.toStringAsFixed(2);
    s = s.replaceFirst(RegExp(r'0$'), '');
    s = s.replaceFirst(RegExp(r'\.$'), '');
    return s;
  }

  void _setQuantity(double newQty, {bool syncController = true}) {
    final clamped = double.parse(newQty.clamp(0.25, 99).toStringAsFixed(2));
    setState(() => _quantity = clamped);
    if (syncController) {
      _qtyController.text = _formatQty(clamped);
    }
  }

  // Parses whatever the user typed when the field loses focus, reverting to
  // the last valid value if it can't be parsed.
  void _commitQtyText() {
    final parsed =
        double.tryParse(_qtyController.text.trim().replaceAll(',', '.'));
    if (parsed == null || parsed <= 0) {
      _qtyController.text = _formatQty(_quantity);
      return;
    }
    _setQuantity(parsed);
  }

  void _bumpQuantity(double step) {
    HapticFeedback.selectionClick();
    _setQuantity(_quantity + step);
  }

  // Long-press-to-repeat: single bump immediately, then repeats, speeding up
  // after the first few ticks so small and large adjustments both feel natural.
  void _startHold(double step) {
    _bumpQuantity(step);
    var tick = 0;
    _holdTimer = Timer.periodic(const Duration(milliseconds: 350), (timer) {
      tick++;
      _bumpQuantity(step);
      if (tick == 3) {
        timer.cancel();
        _holdTimer = Timer.periodic(
            const Duration(milliseconds: 110), (_) => _bumpQuantity(step));
      }
    });
  }

  void _stopHold() {
    _holdTimer?.cancel();
    _holdTimer = null;
  }

  Future<void> _load() async {
    try {
      final food = await getFoodDetail(widget.foodId);
      if (mounted)
        setState(() {
          _food = food;
          _loading = false;
        });
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
        body: Center(
            child: CircularProgressIndicator(color: CalorificColors.green)),
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
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
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
                    Text(
                        '${_formatQty(_quantity)} × ${food.servingSize.round()}${food.servingSizeUnit}',
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
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _spinBtn(Icons.remove, CalorificColors.cream,
                        CalorificColors.textDark, -0.25),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          _qtyFocusNode.requestFocus();
                          _qtyController.selection = TextSelection(
                              baseOffset: 0,
                              extentOffset: _qtyController.text.length);
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 8),
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          decoration: BoxDecoration(
                            color: CalorificColors.cream,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              IntrinsicWidth(
                                child: TextField(
                                  controller: _qtyController,
                                  focusNode: _qtyFocusNode,
                                  textAlign: TextAlign.center,
                                  keyboardType:
                                      const TextInputType.numberWithOptions(
                                          decimal: true),
                                  style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: CalorificColors.textDark),
                                  decoration: const InputDecoration(
                                    isDense: true,
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                  onSubmitted: (_) => _qtyFocusNode.unfocus(),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _quantity == 1 ? 'serving' : 'servings',
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: CalorificColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    _spinBtn(
                        Icons.add, CalorificColors.green, Colors.white, 0.25),
                  ],
                ),
                const SizedBox(height: 12),
                // Quick presets for the most common serving multiples
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: _qtyPresets.map((p) => _presetChip(p)).toList(),
                ),
                const SizedBox(height: 10),
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
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
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
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _meal == m.$1
                                        ? CalorificColors.green
                                        : CalorificColors.cream,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      Text(m.$3,
                                          style: const TextStyle(fontSize: 16)),
                                      const SizedBox(height: 2),
                                      Text(m.$2,
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: _meal == m.$1
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
          const SizedBox(height: 12),

          // Nutrition facts
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Nutrition facts',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text(
                    'Per ${_formatQty(_quantity)} serving${_quantity != 1 ? "s" : ""}',
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

  // Spin-box style +/- button: single tap nudges by [step], holding it down
  // repeats and accelerates (see _startHold).
  Widget _spinBtn(IconData icon, Color bg, Color fg, double step) =>
      GestureDetector(
        onTap: () => _bumpQuantity(step),
        onLongPressStart: (_) => _startHold(step),
        onLongPressEnd: (_) => _stopHold(),
        onLongPressUp: _stopHold,
        onLongPressCancel: _stopHold,
        child: Container(
          width: 44,
          height: 44,
          decoration:
              BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: fg, size: 20),
        ),
      );

  // Tappable chip for a common serving multiple (0.5x, 1x, 1.5x, etc).
  Widget _presetChip(double value) {
    final selected = (_quantity - value).abs() < 0.001;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        _setQuantity(value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? CalorificColors.green : CalorificColors.cream,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '${_formatQty(value)}×',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: selected ? Colors.white : CalorificColors.textDark,
          ),
        ),
      ),
    );
  }

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
