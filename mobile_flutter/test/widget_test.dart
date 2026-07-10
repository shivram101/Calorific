// Smoke test — verifies the app builds and shows the auth gate.
// Real unit tests land next week (Zack's testing pass).

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/main.dart';

void main() {
  testWidgets('App boots to the start gate', (WidgetTester tester) async {
    await tester.pumpWidget(const CalorificApp());
    expect(find.byType(StartGate), findsOneWidget);
  });
}
