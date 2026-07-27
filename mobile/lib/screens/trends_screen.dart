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
  bool _isMetric = true;
  final _weightController = TextEditingController();

  static const double _kgPerLb = 0.45359237;

  // Converts a canonical kg value to whichever unit is currently displayed.
  double _displayWeight(double kg) => _isMetric ? kg : kg / _kgPerLb;

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

  void _setUnitSystem(bool metric) {
    if (metric == _isMetric) return;
    setState(() {
      _isMetric = metric;
      _weightController.clear();
    });
  }

  Future<void> _logWeight() async {
    final entered = double.tryParse(_weightController.text);
    if (entered == null || entered <= 0) return;
    final weightKg = _isMetric ? entered : entered * _kgPerLb;
    try {
      await logWeight(weightKg);
      _weightController.clear();
      FocusScope.of(context).unfocus();
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Weight logged'),
            backgroundColor: CalorificColors.green));
      }
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
                        _unitToggle(),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _weightController,
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                        decimal: true),
                                decoration: InputDecoration(
                                  hintText: _isMetric ? '70.5' : '155',
                                  suffixText: _isMetric ? 'kg' : 'lbs',
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
                        Text(_isMetric ? 'Weight (kg)' : 'Weight (lbs)',
                            style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 180,
                          child: _weights.isEmpty
                              ? Center(
                                  child: Text(
                                      'Log your weight to start the trend',
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
                                                _displayWeight(
                                                    e.value.weightKg)))
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
                                          reservedSize: 44,
                                          interval: 500,
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
                                                  color: CalorificColors.green,
                                                  width: 6,
                                                  borderRadius:
                                                      BorderRadius.circular(3),
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

  // Metric / Imperial segmented toggle — governs both the weight input and
  // the weight chart below it.
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
