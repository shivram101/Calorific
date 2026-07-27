// lib/screens/micro_detail_screen.dart
// Full micronutrient breakdown for a food item.
// Calls GET /api/foods/:id/micronutrients
// Navigate here from food_detail_screen with foodId argument.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class MicroDetailScreen extends StatefulWidget {
  final String foodId;
  final String foodName;

  const MicroDetailScreen({
    super.key,
    required this.foodId,
    required this.foodName,
  });

  @override
  State<MicroDetailScreen> createState() => _MicroDetailScreenState();
}

class _MicroDetailScreenState extends State<MicroDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;
  final Map<String, bool> _expanded = {
    'Proximates': true,
    'Vitamins': true,
    'Minerals': true,
    'Fats': false,
    'Amino Acids': false,
  };

  static const categoryColors = {
    'Proximates': Color(0xFF8A8378),
    'Fats': CalorificColors.fat,
    'Minerals': CalorificColors.green,
    'Vitamins': CalorificColors.carbs,
    'Amino Acids': CalorificColors.protein,
  };

  static const categoryIcons = {
    'Proximates': Icons.water_drop_outlined,
    'Fats': Icons.opacity,
    'Minerals': Icons.diamond_outlined,
    'Vitamins': Icons.wb_sunny_outlined,
    'Amino Acids': Icons.fitness_center_outlined,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await getMicronutrients(widget.foodId);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CalorificColors.cream,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Micronutrients',
                style:
                    TextStyle(fontSize: 11, color: CalorificColors.textMuted)),
            Text(widget.foodName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: CalorificColors.green))
          : _error != null
              ? _buildError()
              : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 48, color: CalorificColors.textMuted),
            const SizedBox(height: 12),
            Text(
              _error ?? 'No micronutrient data available',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: CalorificColors.textMuted),
            ),
            const SizedBox(height: 8),
            const Text(
              'Micronutrient data is most complete for USDA Foundation and SR Legacy foods. Branded products may have limited data.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: CalorificColors.textMuted),
            ),
            const SizedBox(height: 20),
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

  Widget _buildContent() {
    final micronutrients =
        _data?['micronutrients'] as Map<String, dynamic>? ?? {};
    final foodName = _data?['foodName'] ?? widget.foodName;
    final servingSize = _data?['servingSize'];
    final servingSizeUnit = _data?['servingSizeUnit'] ?? 'g';
    final source = _data?['source'];

    int totalNutrients = 0;
    for (final cat in micronutrients.values) {
      if (cat is List) totalNutrients += cat.length;
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary card
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FBF6),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Per $servingSize $servingSizeUnit',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '$totalNutrients nutrients tracked',
                        style: const TextStyle(
                            fontSize: 11, color: CalorificColors.textMuted),
                      ),
                    ],
                  ),
                  if (source == 'fdc')
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: CalorificColors.greenLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('USDA Verified',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: CalorificColors.greenDark)),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              // Category pills
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: micronutrients.keys.map((cat) {
                  final color = categoryColors[cat] ?? CalorificColors.textMuted;
                  final count = (micronutrients[cat] as List?)?.length ?? 0;
                  return Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                              color: color, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 5),
                        Text('$cat ($count)',
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: color)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        // Category sections
        ...micronutrients.entries.map((entry) {
          final cat = entry.key;
          final items = entry.value as List;
          final color = categoryColors[cat] ?? CalorificColors.textMuted;
          final icon = categoryIcons[cat] ?? Icons.list;
          final isExpanded = _expanded[cat] != false;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.05), blurRadius: 8),
              ],
            ),
            child: Column(
              children: [
                // Category header
                GestureDetector(
                  onTap: () => setState(
                      () => _expanded[cat] = !(_expanded[cat] ?? true)),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.06),
                      borderRadius: BorderRadius.vertical(
                        top: const Radius.circular(16),
                        bottom: isExpanded
                            ? Radius.zero
                            : const Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(icon, size: 14, color: color),
                        ),
                        const SizedBox(width: 10),
                        Text(cat,
                            style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 6),
                        Text('${items.length} nutrients',
                            style: const TextStyle(
                                fontSize: 11,
                                color: CalorificColors.textMuted)),
                        const Spacer(),
                        Icon(
                            isExpanded
                                ? Icons.keyboard_arrow_up
                                : Icons.keyboard_arrow_down,
                            color: CalorificColors.textMuted),
                      ],
                    ),
                  ),
                ),

                // Nutrient rows
                if (isExpanded)
                  ...items.asMap().entries.map((e) {
                    final idx = e.key;
                    final nutrient = e.value as Map<String, dynamic>;
                    final isLast = idx == items.length - 1;
                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: idx % 2 == 1
                            ? const Color(0xFFFAFAF8)
                            : Colors.white,
                        borderRadius: isLast
                            ? const BorderRadius.vertical(
                                bottom: Radius.circular(16))
                            : BorderRadius.zero,
                        border: !isLast
                            ? const Border(
                                bottom: BorderSide(
                                    color: Color(0xFFF5F3F0)))
                            : null,
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              nutrient['name'] ?? '',
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: CalorificColors.textDark),
                            ),
                          ),
                          Text(
                            '${nutrient['amount']} ',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: color),
                          ),
                          Text(
                            nutrient['unit'] ?? '',
                            style: const TextStyle(
                                fontSize: 11,
                                color: CalorificColors.textMuted),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          );
        }),

        if (micronutrients.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text(
                'No micronutrient data available for this food.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13, color: CalorificColors.textMuted),
              ),
            ),
          ),

        const Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: Text(
            'Data from USDA FoodData Central. Values per serving as shown above.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 9, color: CalorificColors.textFaint),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}
