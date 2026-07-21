// Unit tests — API endpoint functions (client.dart).
// These test the CLIENT-SIDE endpoint functions (login, searchFoods, addLog,
// setTargets, ...) against a mocked HTTP layer: no real network, no real
// server. Verifies each function builds the correct request (method, path,
// body, auth header) and correctly parses success + error responses.
//
// Uses MockClient from package:http/testing (ships with the http package —
// no new dependency) injected via http.runWithClient, so the production
// client.dart is tested completely unmodified.
//
// Run: flutter test test/api_endpoints_test.dart

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:calorific/api/client.dart';

/// Runs [fn] with all top-level http calls routed to [mock].
Future<T> withMock<T>(MockClient mock, Future<T> Function() fn) {
  return http.runWithClient(fn, () => mock);
}

/// Convenience: a MockClient that records the request and returns [body].
MockClient respondWith(String body,
    {int status = 200, void Function(http.Request)? capture}) {
  return MockClient((request) async {
    capture?.call(request);
    return http.Response(body, status,
        headers: {'content-type': 'application/json'});
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    // In-memory fake storage with a token already "saved".
    SharedPreferences.setMockInitialValues({'token': 'test-jwt'});
  });

  group('auth endpoints', () {
    test('login POSTs credentials, stores the returned token, parses the user',
        () async {
      SharedPreferences.setMockInitialValues({}); // start logged out
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({
          'token': 'server-jwt-123',
          'user': {
            'id': 'u1',
            'email': 'knight@ucf.edu',
            'firstName': 'Knight',
            'lastName': 'Ro',
            'isVerified': true,
          },
        }),
        capture: (r) => captured = r,
      );

      final user = await withMock(mock, () => login('knight@ucf.edu', 'pw12345678'));

      expect(captured!.method, 'POST');
      expect(captured!.url.path, endsWith('/login'));
      final sent = jsonDecode(captured!.body);
      expect(sent['email'], 'knight@ucf.edu');
      expect(sent['password'], 'pw12345678');
      // login is a public endpoint — no Authorization header
      expect(captured!.headers.containsKey('Authorization'), isFalse);
      // response handling
      expect(user.email, 'knight@ucf.edu');
      expect(await getToken(), 'server-jwt-123');
    });

    test('login with wrong password throws ApiException with server message',
        () async {
      final mock = respondWith(
          jsonEncode({'error': 'Invalid email or password'}),
          status: 401);

      await expectLater(
        withMock(mock, () => login('a@b.com', 'wrong')),
        throwsA(isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 401)
            .having((e) => e.message, 'message', 'Invalid email or password')),
      );
    });

    test('register POSTs all four signup fields', () async {
      http.Request? captured;
      final mock = respondWith(jsonEncode({'message': 'Account created'}),
          capture: (r) => captured = r);

      await withMock(
          mock, () => register('new@ucf.edu', 'pw12345678', 'New', 'User'));

      final sent = jsonDecode(captured!.body);
      expect(captured!.url.path, endsWith('/register'));
      expect(sent['email'], 'new@ucf.edu');
      expect(sent['firstName'], 'New');
      expect(sent['lastName'], 'User');
    });

    test('authenticated requests attach the Bearer token header', () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({'_id': 'u1', 'email': 'knight@ucf.edu'}),
        capture: (r) => captured = r,
      );

      await withMock(mock, () => getProfile());

      expect(captured!.headers['Authorization'], 'Bearer test-jwt');
    });
  });

  group('food endpoints', () {
    test('searchFoods GETs /foods/search with the query and parses the list',
        () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode([
          {'_id': 'f1', 'name': 'Banana', 'calories': 105},
          {'_id': 'f2', 'name': 'Banana bread', 'calories': 320},
        ]),
        capture: (r) => captured = r,
      );

      final foods = await withMock(mock, () => searchFoods('banana'));

      expect(captured!.url.path, endsWith('/foods/search'));
      expect(captured!.url.queryParameters['q'], 'banana');
      expect(foods.length, 2);
      expect(foods.first.name, 'Banana');
      expect(foods.first.calories, 105);
    });

    test('getFoodDetail GETs /foods/:id and parses one food', () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({'_id': 'f1', 'name': 'Oatmeal', 'protein': 10}),
        capture: (r) => captured = r,
      );

      final food = await withMock(mock, () => getFoodDetail('f1'));

      expect(captured!.url.path, endsWith('/foods/f1'));
      expect(food.name, 'Oatmeal');
      expect(food.protein, 10);
    });

    test('lookupBarcode GETs /foods/barcode/:upc (the scanner endpoint)',
        () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode(
            {'_id': 'f9', 'name': "Reese's Puffs", 'brand': 'General Mills'}),
        capture: (r) => captured = r,
      );

      final food = await withMock(mock, () => lookupBarcode('016000122222'));

      expect(captured!.url.path, endsWith('/foods/barcode/016000122222'));
      expect(food.brand, 'General Mills');
    });

    test('createCustomFood POSTs the custom food body and parses the result',
        () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({'_id': 'c1', 'name': 'Bar Coke', 'calories': 100}),
        capture: (r) => captured = r,
      );

      final food = await withMock(
          mock, () => createCustomFood(name: 'Bar Coke', calories: 100));

      final sent = jsonDecode(captured!.body);
      expect(captured!.url.path, endsWith('/foods/custom'));
      expect(sent['name'], 'Bar Coke');
      expect(sent['calories'], 100);
      expect(food.id, 'c1');
    });
  });

  group('log + water endpoints', () {
    test('getLogs GETs /logs?date= and parses entries + totals', () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({
          'date': '2026-07-14',
          'entries': [
            {'_id': 'l1', 'foodName': 'Oatmeal', 'calories': 300, 'meal': 'breakfast'}
          ],
          'totals': {'calories': 300, 'protein': 10, 'fat': 5, 'carbs': 54},
        }),
        capture: (r) => captured = r,
      );

      final log = await withMock(mock, () => getLogs('2026-07-14'));

      expect(captured!.url.queryParameters['date'], '2026-07-14');
      expect(log.entries.single.foodName, 'Oatmeal');
      expect(log.totals.calories, 300);
    });

    test('addLog POSTs foodId, quantity, meal and date', () async {
      http.Request? captured;
      final mock =
          respondWith(jsonEncode({'message': 'ok'}), capture: (r) => captured = r);

      await withMock(
          mock,
          () => addLog(
              foodId: 'f1', quantity: 1.5, meal: 'lunch', date: '2026-07-14'));

      final sent = jsonDecode(captured!.body);
      expect(captured!.method, 'POST');
      expect(sent['foodId'], 'f1');
      expect(sent['quantity'], 1.5);
      expect(sent['meal'], 'lunch');
      expect(sent['date'], '2026-07-14');
    });

    test('deleteLog DELETEs /logs/:id', () async {
      http.Request? captured;
      final mock =
          respondWith(jsonEncode({'message': 'ok'}), capture: (r) => captured = r);

      await withMock(mock, () => deleteLog('l1'));

      expect(captured!.method, 'DELETE');
      expect(captured!.url.path, endsWith('/logs/l1'));
    });

    test('addWater POSTs amount + date and returns the running total',
        () async {
      http.Request? captured;
      final mock = respondWith(jsonEncode({'totalMl': 750}),
          capture: (r) => captured = r);

      final result =
          await withMock(mock, () => addWater(250, '2026-07-14'));

      final sent = jsonDecode(captured!.body);
      expect(sent['amountMl'], 250);
      expect(result['totalMl'], 750);
    });
  });

  group('targets + progress endpoints', () {
    test('getTargets returns null when the user has no goals set', () async {
      final mock = respondWith('null'); // backend sends JSON null

      final targets = await withMock(mock, () => getTargets());

      expect(targets, isNull);
    });

    test('setTargets PUTs the four goal values and parses the saved targets',
        () async {
      http.Request? captured;
      final mock = respondWith(
        jsonEncode({
          'calorieTarget': 2186,
          'proteinTarget': 165,
          'carbTarget': 220,
          'fatTarget': 73,
        }),
        capture: (r) => captured = r,
      );

      final saved = await withMock(
          mock,
          () => setTargets(
              calorieTarget: 2186,
              proteinTarget: 165,
              carbTarget: 220,
              fatTarget: 73));

      expect(captured!.method, 'PUT');
      final sent = jsonDecode(captured!.body);
      expect(sent['calorieTarget'], 2186);
      expect(saved.proteinTarget, 165);
    });

    test('logWeight defaults the date to today when none is given', () async {
      http.Request? captured;
      final mock =
          respondWith(jsonEncode({'message': 'ok'}), capture: (r) => captured = r);

      await withMock(mock, () => logWeight(81.2));

      final sent = jsonDecode(captured!.body);
      expect(sent['weightKg'], 81.2);
      expect(sent['date'], todayString());
    });

    test('getWeightHistory parses the entries list', () async {
      final mock = respondWith(jsonEncode({
        'range': 30,
        'entries': [
          {'weightKg': 82.0, 'date': '2026-07-10'},
          {'weightKg': 81.2, 'date': '2026-07-14'},
        ],
      }));

      final entries = await withMock(mock, () => getWeightHistory());

      expect(entries.length, 2);
      expect(entries.last.weightKg, 81.2);
    });

    test('getProgressSummary parses daily calorie totals', () async {
      final mock = respondWith(jsonEncode({
        'range': 7,
        'summary': [
          {'date': '2026-07-13', 'calories': 1950},
          {'date': '2026-07-14', 'calories': 2100},
        ],
      }));

      final summary =
          await withMock(mock, () => getProgressSummary(range: 7));

      expect(summary.length, 2);
      expect(summary.first.calories, 1950);
    });

    test('server errors surface as ApiException with status code', () async {
      final mock = respondWith(jsonEncode({'error': 'Server error'}),
          status: 500);

      await expectLater(
        withMock(mock, () => getProfile()),
        throwsA(isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 500)),
      );
    });
  });
}
