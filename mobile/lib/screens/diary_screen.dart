// lib/screens/diary_screen.dart
// Main diary screen — daily food log, macro summary, water tracking,
// food search, and navigation to all other screens.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class DiaryScreen extends StatefulWidget {
  const DiaryScreen({super.key});

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen> {
  DailyLog? _log;
  double _waterMl = 0;
  bool _loading = true;
  Targets? _targets;

  static const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  static const mealLabels = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
    'snack': 'Snacks',
  };

  @override
  void initState() {
    super.initState();
    _loadDiary();
  }

  Future<void> _loadDiary() async {
    try {
      final today = todayString();
      final results = await Future.wait([
        getLogs(today),
        getWater(today),
        getTargets(),
      ]);
      if (!mounted) return;
      setState(() {
        _log = results[0] as DailyLog;
        _waterMl = ((results[1] as Map<String, dynamic>)['totalMl'] as num?)
                ?.toDouble() ??
            0;
        _targets = results[2] as Targets?;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      if (e is ApiException && e.statusCode == 401) {
        await logout();
        if (mounted) Navigator.pushReplacementNamed(context, '/login');
        return;
      }
      setState(() => _loading = false);
    }
  }

  int _pendingWater = 0;

  Future<void> _handleAddWater(double amount) async {
    // Optimistic update: bump the counter instantly. Rapid taps each bump;
    // the server total is only reconciled once ALL in-flight requests finish,
    // so the number never flickers backwards mid-burst.
    setState(() => _waterMl += amount);
    _pendingWater++;
    try {
      await addWater(amount, todayString());
    } catch (e) {
      if (mounted) {
        setState(() => _waterMl -= amount);
        _showError(e.toString());
      }
    } finally {
      _pendingWater--;
      if (_pendingWater == 0) {
        try {
          final water = await getWater(todayString());
          if (mounted && _pendingWater == 0) {
            setState(() =>
                _waterMl = ((water['totalMl'] as num?) ?? _waterMl).toDouble());
          }
        } catch (_) {}
      }
    }
  }

  Future<void> _handleDeleteLog(String id) async {
    try {
      await deleteLog(id);
      await _loadDiary();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Removed from diary')),
      );
    } catch (e) {
      _showError(e.toString());
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: CalorificColors.danger),
    );
  }

  // Any screen we navigate away to (goals, trends, barcode scan, settings)
  // can change data the diary depends on, so always refresh on return.
  Future<void> _navigateAndReload(String route, {Object? arguments}) {
    return Navigator.pushNamed(context, route, arguments: arguments)
        .then((_) => _loadDiary());
  }

  void _openFoodSearch() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: CalorificColors.cream,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => _FoodSearchSheet(
        onFoodLogged: _loadDiary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: CalorificColors.cream,
        body: Center(
          child: CircularProgressIndicator(color: CalorificColors.green),
        ),
      );
    }

    final totals = _log?.totals;
    final today = DateTime.now();
    final dateLabel =
        '${_weekday(today.weekday)}, ${_month(today.month)} ${today.day}';

    return Scaffold(
      backgroundColor: CalorificColors.cream,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(dateLabel,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: CalorificColors.textMuted)),
                          const Text('Diary',
                              style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: CalorificColors.textDark)),
                        ],
                      ),
                      Row(
                        children: [
                          _headerButton(Icons.flag_outlined,
                              () => _navigateAndReload('/goals')),
                          const SizedBox(width: 8),
                          _headerButton(Icons.trending_up,
                              () => _navigateAndReload('/trends')),
                          const SizedBox(width: 8),
                          _headerButton(Icons.qr_code_scanner,
                              () => _navigateAndReload('/barcode')),
                          const SizedBox(width: 8),
                          _headerButton(Icons.settings_outlined,
                              () => _navigateAndReload('/settings')),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Calorie/macro summary
                  Container(
                    width: double.infinity,
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
                            const Text('Calories',
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: CalorificColors.textDark)),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  '${totals?.calories.round() ?? 0}',
                                  style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: CalorificColors.green),
                                ),
                                if (_targets != null &&
                                    _targets!.calorieTarget > 0)
                                  Text(
                                    ' / ${_targets!.calorieTarget.round()} kcal',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        color: CalorificColors.textMuted),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _macroRing(
                                'Protein',
                                totals?.protein ?? 0,
                                _targets?.proteinTarget,
                                CalorificColors.protein),
                            _macroRing('Carbs', totals?.carbs ?? 0,
                                _targets?.carbTarget, CalorificColors.carbs),
                            _macroRing('Fat', totals?.fat ?? 0,
                                _targets?.fatTarget, CalorificColors.fat),
                          ],
                        ),
                        if (_targets == null)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: GestureDetector(
                              onTap: () => _navigateAndReload('/goals'),
                              child: const Text(
                                'Set your goals to track progress →',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: CalorificColors.green),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Scrollable content ──
            Expanded(
              child: RefreshIndicator(
                color: CalorificColors.green,
                onRefresh: _loadDiary,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Water tracker
                    _card(
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('💧 Water',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: CalorificColors.textDark)),
                              Text('${_waterMl.round()} ml',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: CalorificColors.fat)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [150, 250, 350, 500]
                                .map((amt) => Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 4),
                                        child: Material(
                                          color: const Color(0xFFEEF4FF),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          child: InkWell(
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            onTap: () =>
                                                _handleAddWater(amt.toDouble()),
                                            child: Padding(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 8),
                                              child: Center(
                                                child: Text('+${amt}ml',
                                                    style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: CalorificColors
                                                            .fat)),
                                              ),
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

                    // Meal sections
                    ...meals.map((meal) {
                      final items =
                          _log?.entries.where((e) => e.meal == meal).toList() ??
                              [];
                      final mealCals =
                          items.fold<double>(0, (sum, e) => sum + e.calories);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _card(
                          padding: EdgeInsets.zero,
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 12),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF9F7F4),
                                  borderRadius: BorderRadius.vertical(
                                      top: Radius.circular(16)),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(mealLabels[meal]!,
                                        style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: CalorificColors.textDark)),
                                    Text('${mealCals.round()} kcal',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: CalorificColors.textMuted)),
                                  ],
                                ),
                              ),
                              if (items.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text('No entries yet',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: CalorificColors.textFaint)),
                                  ),
                                )
                              else
                                ...items.map((item) => Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                              color: Color(0xFFF5F3F0)),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(item.foodName,
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                        fontSize: 14,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: CalorificColors
                                                            .textDark)),
                                                Text(
                                                  '${item.quantity}x · ${item.protein.round()}g P · ${item.carbs.round()}g C · ${item.fat.round()}g F',
                                                  style: const TextStyle(
                                                      fontSize: 11,
                                                      color: CalorificColors
                                                          .textMuted),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text('${item.calories.round()} kcal',
                                              style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                  color: CalorificColors
                                                      .textDark)),
                                          const SizedBox(width: 12),
                                          GestureDetector(
                                            onTap: () =>
                                                _handleDeleteLog(item.id),
                                            child: const Icon(
                                                Icons.close_rounded,
                                                size: 18,
                                                color: CalorificColors.danger),
                                          ),
                                        ],
                                      ),
                                    )),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Add food FAB
      floatingActionButton: FloatingActionButton(
        onPressed: _openFoodSearch,
        backgroundColor: CalorificColors.green,
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _headerButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: CalorificColors.greenLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 20, color: CalorificColors.green),
      ),
    );
  }

  // Compact ring showing progress toward a macro goal. Falls back to a
  // plain gram count (no ring fill) when the person hasn't set a target yet.
  Widget _macroRing(String label, double value, double? target, Color color) {
    final hasTarget = target != null && target > 0;
    final pct = hasTarget ? value / target : 0.0;
    final clamped = pct < 0 ? 0.0 : (pct > 1 ? 1.0 : pct);
    final isOver = pct > 1.0;
    final ringColor = isOver ? CalorificColors.danger : color;

    return Column(
      children: [
        SizedBox(
          width: 60,
          height: 60,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  value: hasTarget ? clamped : 0,
                  strokeWidth: 6,
                  backgroundColor: color.withOpacity(0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(ringColor),
                ),
              ),
              Text(
                hasTarget ? '${(pct * 100).round()}%' : '${value.round()}g',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: CalorificColors.textDark),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Text(label,
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: CalorificColors.textDark)),
        Text(
          hasTarget
              ? '${value.round()}/${target.round()}g'
              : '${value.round()}g',
          style:
              const TextStyle(fontSize: 10, color: CalorificColors.textMuted),
        ),
      ],
    );
  }

  Widget _card({required Widget child, EdgeInsets? padding}) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  String _weekday(int day) => const [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ][day - 1];

  String _month(int month) => const [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ][month - 1];
}

// ─── Food search bottom sheet ──────────────────────────────────

class _FoodSearchSheet extends StatefulWidget {
  final VoidCallback onFoodLogged;
  const _FoodSearchSheet({required this.onFoodLogged});

  @override
  State<_FoodSearchSheet> createState() => _FoodSearchSheetState();
}

class _FoodSearchSheetState extends State<_FoodSearchSheet> {
  final _searchController = TextEditingController();
  List<Food> _results = [];
  bool _searching = false;

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;
    setState(() => _searching = true);
    try {
      final results = await searchFoods(query);
      setState(() => _results = results);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString()),
              backgroundColor: CalorificColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.85,
        builder: (context, scrollController) => Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Add food',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: CalorificColors.textDark)),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Icon(Icons.close,
                            color: CalorificColors.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Search row
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onSubmitted: (_) => _handleSearch(),
                          textInputAction: TextInputAction.search,
                          decoration: const InputDecoration(
                              hintText: 'Search foods...'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _handleSearch,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CalorificColors.green,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: _searching
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2),
                                )
                              : const Icon(Icons.search,
                                  color: Colors.white, size: 18),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, '/barcode')
                              .then((_) => widget.onFoodLogged());
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CalorificColors.greenLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.qr_code_scanner,
                              color: CalorificColors.green, size: 18),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                          Navigator.pushNamed(context, '/custom-food')
                              .then((_) => widget.onFoodLogged());
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: CalorificColors.greenLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.add_circle_outline,
                              color: CalorificColors.green, size: 18),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Results
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _results.length,
                itemBuilder: (context, index) {
                  final food = _results[index];
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(
                        context,
                        '/food-detail',
                        arguments: {'foodId': food.id},
                      ).then((_) => widget.onFoodLogged());
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(food.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: CalorificColors.textDark)),
                                if (food.brand != null)
                                  Text(food.brand!,
                                      style: const TextStyle(
                                          fontSize: 11,
                                          color: CalorificColors.textMuted)),
                              ],
                            ),
                          ),
                          Text('${food.calories.round()} kcal',
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: CalorificColors.green)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
