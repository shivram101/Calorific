// Unit tests — helper functions (client.dart).
// Run: flutter test test/helpers_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:calorific/api/client.dart';

void main() {
  group('todayString', () {
    test('returns YYYY-MM-DD format', () {
      final s = todayString();
      expect(s.length, 10);
      expect(RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(s), isTrue);
    });

    test('is a parseable, current date', () {
      final parsed = DateTime.parse(todayString());
      final now = DateTime.now().toUtc();
      // Same day (allowing the test to straddle midnight by one day at most)
      expect(now.difference(parsed).inDays.abs() <= 1, isTrue);
    });
  });

  group('ApiException', () {
    test('carries message and status code', () {
      final e = ApiException('Invalid email or password', 401);
      expect(e.message, 'Invalid email or password');
      expect(e.statusCode, 401);
      expect(e.toString(), contains('Invalid email or password'));
    });
  });
}
