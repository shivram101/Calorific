// lib/screens/trends_screen.dart
// Weight history + daily calorie charts using fl_chart.
// GET /api/progress/weight and GET /api/progress/summary.

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class TrendsScreen extends StatefulWidget {
  const TrendsScreen({super.key});

  @override
  State<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends State<TrendsScreen> {
  bool _loading = true;
  List<WeightEntry> _weights = [];
  List<DailySummary> _summary = [];
  int _range = 30;
  final _weightController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        getWeightHistory(range: _range),
        getProgressSummary(range: _range),
      ]);
      if (!mounted) return;
      setState(() {
        _weights = results[0] as List<WeightEntry>;
        _summary = results[1] as List<DailySummary>;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logWeight() async {
    final weight = double.tryParse(_weightController.text);
    if (weight == null || weight <= 0) return;
    try {
      await logWeight(weight);
      _weightController.clear();
      FocusScope.of(context).unfocus();
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(e.toString()),
            backgroundColor: CalorificColors.danger));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CalorificColors.cream,
      appBar: AppBar(
        title: const Text('Trends',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          // Range selector
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [7, 30, 90]
                  .map((r) => GestureDetector(
                        onTap: () {
                          setState(() => _range = r);
                          _load();
                        },
                        child: Container(
                          margin: const EdgeInsets.only(left: 6),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: _range == r
                                ? CalorificColors.green
                                : CalorificColors.cream,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text('${r}d',
                              style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: _range == r
                                      ? Colors.white
                                      : CalorificColors.textMuted)),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: CalorificColors.green))
          : RefreshIndicator(
              color: CalorificColors.green,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Log weight
                  _card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Log weight',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _weightController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  hintText: '70.5',
                                  suffixText: 'kg',
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _logWeight,
                              child: const Text('Log'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Weight chart
                  _card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Weight',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 180,
                          child: _weights.length < 2
                              ? const Center(
                                  child: Text(
                                      'Log weight on at least 2 days to see your trend',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: CalorificColors.textMuted)))
                              : LineChart(
                                  LineChartData(
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: false,
                                      getDrawingHorizontalLine: (v) => FlLine(
                                          color: const Color(0xFFF0EDE8),
                                          strokeWidth: 1),
                                    ),
                                    titlesData: FlTitlesData(
                                      topTitles: const AxisTitles(),
                                      rightTitles: const AxisTitles(),
                                      bottomTitles: const AxisTitles(),
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 36,
                                          getTitlesWidget: (v, _) => Text(
                                              v.round().toString(),
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  color: CalorificColors
                                                      .textMuted)),
                                        ),
                                      ),
                                    ),
                                    borderData: FlBorderData(show: false),
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: _weights
                                            .asMap()
                                            .entries
                                            .map((e) => FlSpot(
                                                e.key.toDouble(),
                                                e.value.weightKg))
                                            .toList(),
                                        isCurved: true,
                                        color: CalorificColors.green,
                                        barWidth: 3,
                                        dotData: FlDotData(
                                          show: true,
                                          getDotPainter: (s, p, b, i) =>
                                              FlDotCirclePainter(
                                            radius: 3,
                                            color: CalorificColors.green,
                                            strokeColor: Colors.white,
                                            strokeWidth: 2,
                                          ),
                                        ),
                                        belowBarData: BarAreaData(
                                          show: true,
                                          color: CalorificColors.green
                                              .withOpacity(0.08),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Calorie chart
                  _card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Daily calories',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 180,
                          child: _summary.isEmpty
                              ? const Center(
                                  child: Text(
                                      'Log some food to see your calorie history',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: CalorificColors.textMuted)))
                              : BarChart(
                                  BarChartData(
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: false,
                                      getDrawingHorizontalLine: (v) => FlLine(
                                          color: const Color(0xFFF0EDE8),
                                          strokeWidth: 1),
                                    ),
                                    titlesData: FlTitlesData(
                                      topTitles: const AxisTitles(),
                                      rightTitles: const AxisTitles(),
                                      bottomTitles: const AxisTitles(),
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 40,
                                          getTitlesWidget: (v, _) => Text(
                                              v.round().toString(),
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  color: CalorificColors
                                                      .textMuted)),
                                        ),
                                      ),
                                    ),
                                    borderData: FlBorderData(show: false),
                                    barGroups: _summary
                                        .asMap()
                                        .entries
                                        .map((e) => BarChartGroupData(
                                              x: e.key,
                                              barRods: [
                                                BarChartRodData(
                                                  toY: e.value.calories,
                                                  color:
                                                      CalorificColors.green,
                                                  width: 6,
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          3),
                                                ),
                                              ],
                                            ))
                                        .toList(),
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
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
    _weightController.dispose();
    super.dispose();
  }
}
