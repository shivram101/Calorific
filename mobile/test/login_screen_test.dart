// Widget tests — Login screen.
// Verifies the screen renders and client-side validation fires
// (no network calls are made when fields are empty).
// Run: flutter test test/login_screen_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:calorific/screens/login_screen.dart';

void main() {
  Widget wrap(Widget child) => MaterialApp(home: child);

  group('LoginScreen', () {
    testWidgets('renders email and password fields and a login button',
        (tester) async {
      await tester.pumpWidget(wrap(const LoginScreen()));
      expect(find.byType(TextField), findsNWidgets(2));
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('shows validation error when submitting empty fields',
        (tester) async {
      await tester.pumpWidget(wrap(const LoginScreen()));
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();
      expect(find.text('Please enter your email and password'), findsOneWidget);
    });

    testWidgets('error clears is not shown before any submit', (tester) async {
      await tester.pumpWidget(wrap(const LoginScreen()));
      expect(find.text('Please enter your email and password'), findsNothing);
    });
  });
}
