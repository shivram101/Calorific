// Unit tests — API model parsing (client.dart).
// Verifies every fromJson constructor handles both complete server
// responses and missing/partial data without crashing.
// Run: flutter test test/models_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:calorific/api/client.dart';

void main() {
  group('Food.fromJson', () {
    test('parses a complete USDA food response', () {
      final food = Food.fromJson({
        '_id': 'abc123',
        'source': 'fdc',
        'fdcId': 456,
        'name': 'Banana',
        'brand': 'Dole',
        'servingSize': 118,
        'servingSizeUnit': 'g',
        'calories': 105,
        'protein': 1.3,
        'fat': 0.4,
        'carbs': 27,
      });
      expect(food.id, 'abc123');
      expect(food.name, 'Banana');
      expect(food.brand, 'Dole');
      expect(food.calories, 105);
      expect(food.protein, 1.3);
      expect(food.carbs, 27);
    });

    test('applies safe defaults when fields are missing', () {
      final food = Food.fromJson({'name': 'Mystery'});
      expect(food.name, 'Mystery');
      expect(food.calories, 0);
      expect(food.servingSize, 100);
      expect(food.servingSizeUnit, 'g');
      expect(food.brand, isNull);
    });

    test('converts integer macros to doubles', () {
      final food = Food.fromJson({'calories': 200, 'protein': 30});
      expect(food.calories, isA<double>());
      expect(food.protein, 30.0);
    });
  });

  group('LogEntry.fromJson', () {
    test('parses a diary entry', () {
      final entry = LogEntry.fromJson({
        '_id': 'log1',
        'foodId': 'abc123',
        'foodName': 'Banana',
        'quantity': 1.5,
        'meal': 'lunch',
        'date': '2026-07-14',
        'calories': 157.5,
      });
      expect(entry.foodName, 'Banana');
      expect(entry.meal, 'lunch');
      expect(entry.quantity, 1.5);
      expect(entry.calories, 157.5);
    });

    test('defaults meal to breakfast and quantity to 1', () {
      final entry = LogEntry.fromJson({});
      expect(entry.meal, 'breakfast');
      expect(entry.quantity, 1);
      expect(entry.calories, 0);
    });
  });

  group('DailyLog.fromJson', () {
    test('parses entries list and totals together', () {
      final log = DailyLog.fromJson({
        'date': '2026-07-14',
        'entries': [
          {'foodName': 'Oatmeal', 'calories': 300},
          {'foodName': 'Banana', 'calories': 105},
        ],
        'totals': {'calories': 405, 'protein': 11, 'fat': 4, 'carbs': 81},
      });
      expect(log.entries.length, 2);
      expect(log.entries.first.foodName, 'Oatmeal');
      expect(log.totals.calories, 405);
    });

    test('handles an empty day (no entries, no totals)', () {
      final log = DailyLog.fromJson({'date': '2026-07-14'});
      expect(log.entries, isEmpty);
      expect(log.totals.calories, 0);
    });
  });

  group('Targets.fromJson', () {
    test('parses the four macro targets', () {
      final t = Targets.fromJson({
        'calorieTarget': 2186,
        'proteinTarget': 165,
        'carbTarget': 220,
        'fatTarget': 73,
      });
      expect(t.calorieTarget, 2186);
      expect(t.proteinTarget, 165);
      expect(t.carbTarget, 220);
      expect(t.fatTarget, 73);
    });

    test('defaults all targets to 0 when unset', () {
      final t = Targets.fromJson({});
      expect(t.calorieTarget, 0);
      expect(t.fatTarget, 0);
    });
  });

  group('UserProfile.fromJson', () {
    test('parses a full profile including onboarding fields', () {
      final p = UserProfile.fromJson({
        '_id': 'u1',
        'email': 'test@ucf.edu',
        'firstName': 'Knight',
        'lastName': 'Ro',
        'isVerified': true,
        'heightCm': 175,
        'weightKg': 70.5,
        'sex': 'male',
        'activityLevel': 'Active',
        'goal': 'maintain',
        'age': 22,
      });
      expect(p.email, 'test@ucf.edu');
      expect(p.isVerified, isTrue);
      expect(p.heightCm, 175.0);
      expect(p.weightKg, 70.5);
      expect(p.age, 22);
    });

    test('unverified new user with null onboarding fields', () {
      final p = UserProfile.fromJson({'email': 'new@ucf.edu'});
      expect(p.isVerified, isFalse);
      expect(p.heightCm, isNull);
      expect(p.goal, isNull);
    });
  });

  group('WeightEntry / DailySummary', () {
    test('WeightEntry parses weight and date', () {
      final w = WeightEntry.fromJson({'weightKg': 81.2, 'date': '2026-07-14'});
      expect(w.weightKg, 81.2);
      expect(w.date, '2026-07-14');
    });

    test('DailySummary parses a day of macro totals', () {
      final s = DailySummary.fromJson(
          {'date': '2026-07-14', 'calories': 1950, 'protein': 140});
      expect(s.calories, 1950);
      expect(s.protein, 140);
      expect(s.fat, 0);
    });
  });
}
