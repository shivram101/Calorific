// lib/api/client.dart
// Central API client for Calorific — updated to match web client.ts parity.

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'https://calorific-api-begdg4bhf0gga5d2.northcentralus-01.azurewebsites.net';

// ─── Token helpers ───────────────────────────────────────────────

Future<String?> getToken() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('token');
}

Future<void> setToken(String token) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('token', token);
}

Future<void> clearToken() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('token');
}

// ─── Base request helper ─────────────────────────────────────────

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

Future<dynamic> _request(
  String method,
  String path, {
  Map<String, dynamic>? body,
  bool auth = true,
}) async {
  final headers = <String, String>{'Content-Type': 'application/json'};

  if (auth) {
    final token = await getToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
  }

  final uri = Uri.parse('$baseUrl$path');
  late http.Response response;

  switch (method) {
    case 'GET':
      response = await http.get(uri, headers: headers);
      break;
    case 'POST':
      response = await http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
      break;
    case 'PUT':
      response = await http.put(uri, headers: headers, body: jsonEncode(body ?? {}));
      break;
    case 'DELETE':
      response = await http.delete(uri, headers: headers);
      break;
    default:
      throw ApiException('Unsupported method: $method', 0);
  }

  final data = response.body.isNotEmpty ? jsonDecode(response.body) : null;

  if (response.statusCode >= 400) {
    final msg = (data is Map && data['error'] != null)
        ? data['error'] as String
        : 'Something went wrong';
    throw ApiException(msg, response.statusCode);
  }

  return data;
}

// ─── Models ──────────────────────────────────────────────────────

class UserProfile {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final bool isVerified;
  final double? heightCm;
  final double? weightKg;
  final String? sex;
  final String? activityLevel;
  final String? goal;
  final int? age;

  UserProfile.fromJson(Map<String, dynamic> json)
      : id = json['_id'] ?? '',
        email = json['email'] ?? '',
        firstName = json['firstName'] ?? '',
        lastName = json['lastName'] ?? '',
        isVerified = json['isVerified'] ?? false,
        heightCm = (json['heightCm'] as num?)?.toDouble(),
        weightKg = (json['weightKg'] as num?)?.toDouble(),
        sex = json['sex'],
        activityLevel = json['activityLevel'],
        goal = json['goal'],
        age = json['age'];
}

class Food {
  final String id;
  final String source;
  final int? fdcId;
  final String name;
  final String? brand;
  final double servingSize;
  final String servingSizeUnit;
  final double calories;
  final double protein;
  final double fat;
  final double carbs;

  Food.fromJson(Map<String, dynamic> json)
      : id = json['_id'] ?? '',
        source = json['source'] ?? '',
        fdcId = json['fdcId'],
        name = json['name'] ?? '',
        brand = json['brand'],
        servingSize = (json['servingSize'] as num?)?.toDouble() ?? 100,
        servingSizeUnit = json['servingSizeUnit'] ?? 'g',
        calories = (json['calories'] as num?)?.toDouble() ?? 0,
        protein = (json['protein'] as num?)?.toDouble() ?? 0,
        fat = (json['fat'] as num?)?.toDouble() ?? 0,
        carbs = (json['carbs'] as num?)?.toDouble() ?? 0;
}

class LogEntry {
  final String id;
  final String foodId;
  final String foodName;
  final double quantity;
  final String meal;
  final String date;
  final double calories;
  final double protein;
  final double fat;
  final double carbs;

  LogEntry.fromJson(Map<String, dynamic> json)
      : id = json['_id'] ?? '',
        foodId = json['foodId'] ?? '',
        foodName = json['foodName'] ?? '',
        quantity = (json['quantity'] as num?)?.toDouble() ?? 1,
        meal = json['meal'] ?? 'breakfast',
        date = json['date'] ?? '',
        calories = (json['calories'] as num?)?.toDouble() ?? 0,
        protein = (json['protein'] as num?)?.toDouble() ?? 0,
        fat = (json['fat'] as num?)?.toDouble() ?? 0,
        carbs = (json['carbs'] as num?)?.toDouble() ?? 0;
}

class DailyTotals {
  final double calories;
  final double protein;
  final double fat;
  final double carbs;

  DailyTotals.fromJson(Map<String, dynamic> json)
      : calories = (json['calories'] as num?)?.toDouble() ?? 0,
        protein = (json['protein'] as num?)?.toDouble() ?? 0,
        fat = (json['fat'] as num?)?.toDouble() ?? 0,
        carbs = (json['carbs'] as num?)?.toDouble() ?? 0;
}

class DailyLog {
  final String date;
  final List<LogEntry> entries;
  final DailyTotals totals;

  DailyLog.fromJson(Map<String, dynamic> json)
      : date = json['date'] ?? '',
        entries = ((json['entries'] ?? []) as List)
            .map((e) => LogEntry.fromJson(e))
            .toList(),
        totals = DailyTotals.fromJson(json['totals'] ?? {});
}

class WaterEntry {
  final String id;
  final double amountMl;
  final String date;

  WaterEntry.fromJson(Map<String, dynamic> json)
      : id = json['_id'] ?? '',
        amountMl = (json['amountMl'] as num?)?.toDouble() ?? 0,
        date = json['date'] ?? '';
}

class DailyWater {
  final double totalMl;
  final List<WaterEntry> entries;

  DailyWater.fromJson(Map<String, dynamic> json)
      : totalMl = (json['totalMl'] as num?)?.toDouble() ?? 0,
        entries = ((json['entries'] ?? []) as List)
            .map((e) => WaterEntry.fromJson(e))
            .toList();
}

class Targets {
  final double calorieTarget;
  final double proteinTarget;
  final double carbTarget;
  final double fatTarget;

  Targets.fromJson(Map<String, dynamic> json)
      : calorieTarget = (json['calorieTarget'] as num?)?.toDouble() ?? 0,
        proteinTarget = (json['proteinTarget'] as num?)?.toDouble() ?? 0,
        carbTarget = (json['carbTarget'] as num?)?.toDouble() ?? 0,
        fatTarget = (json['fatTarget'] as num?)?.toDouble() ?? 0;
}

class WeightEntry {
  final double weightKg;
  final String date;

  WeightEntry.fromJson(Map<String, dynamic> json)
      : weightKg = (json['weightKg'] as num?)?.toDouble() ?? 0,
        date = json['date'] ?? '';
}

class DailySummary {
  final String date;
  final double calories;
  final double protein;
  final double fat;
  final double carbs;

  DailySummary.fromJson(Map<String, dynamic> json)
      : date = json['date'] ?? '',
        calories = (json['calories'] as num?)?.toDouble() ?? 0,
        protein = (json['protein'] as num?)?.toDouble() ?? 0,
        fat = (json['fat'] as num?)?.toDouble() ?? 0,
        carbs = (json['carbs'] as num?)?.toDouble() ?? 0;
}

// ─── Helpers ─────────────────────────────────────────────────────

/// Returns today's date as YYYY-MM-DD in the device's LOCAL timezone.
/// (Using toUtc() caused late-night entries to appear on the next day.)
String todayString() {
  final now = DateTime.now();
  final y = now.year.toString().padLeft(4, '0');
  final m = now.month.toString().padLeft(2, '0');
  final d = now.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

// ─── Auth ────────────────────────────────────────────────────────

Future<Map<String, dynamic>> register(
  String email,
  String password,
  String firstName,
  String lastName,
) async {
  final data = await _request('POST', '/register',
      auth: false,
      body: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
      });
  return data as Map<String, dynamic>;
}

Future<UserProfile> login(String email, String password) async {
  final data = await _request('POST', '/login',
      auth: false, body: {'email': email, 'password': password});
  await setToken(data['token']);
  return UserProfile.fromJson({...data['user'], '_id': data['user']['id']});
}

Future<void> logout() async {
  await clearToken();
}

Future<void> forgotPassword(String email) async {
  await _request('POST', '/forgot-password', auth: false, body: {'email': email});
}

Future<void> resendVerification(String email) async {
  await _request('POST', '/resend-verification',
      auth: false, body: {'email': email});
}

// ─── Profile ─────────────────────────────────────────────────────

Future<UserProfile> getProfile() async {
  final data = await _request('GET', '/profile');
  return UserProfile.fromJson(data);
}

Future<void> updateProfile(Map<String, dynamic> updates) async {
  await _request('PUT', '/profile', body: updates);
}

Future<void> deleteAccount() async {
  await _request('DELETE', '/account');
}

// ─── Foods ───────────────────────────────────────────────────────

Future<List<Food>> searchFoods(String query) async {
  final data = await _request('GET', '/foods/search?q=${Uri.encodeComponent(query)}');
  return (data as List).map((f) => Food.fromJson(f)).toList();
}

Future<Food> getFoodDetail(String id) async {
  final data = await _request('GET', '/foods/$id');
  return Food.fromJson(data);
}

Future<Food> lookupBarcode(String upc) async {
  final data = await _request('GET', '/foods/barcode/${Uri.encodeComponent(upc)}');
  return Food.fromJson(data);
}

Future<Food> createCustomFood({
  required String name,
  double servingSize = 1,
  String servingSizeUnit = 'serving',
  required double calories,
  double protein = 0,
  double fat = 0,
  double carbs = 0,
}) async {
  final data = await _request('POST', '/foods/custom', body: {
    'name': name,
    'servingSize': servingSize,
    'servingSizeUnit': servingSizeUnit,
    'calories': calories,
    'protein': protein,
    'fat': fat,
    'carbs': carbs,
  });
  return Food.fromJson(data);
}

Future<Map<String, dynamic>> getMicronutrients(String foodId) async {
  final data = await _request('GET', '/foods/$foodId/micronutrients');
  return data as Map<String, dynamic>;
}

// ─── Logs ────────────────────────────────────────────────────────

Future<DailyLog> getLogs(String date) async {
  final data = await _request('GET', '/logs?date=$date');
  return DailyLog.fromJson(data);
}

Future<void> addLog({
  required String foodId,
  required double quantity,
  required String meal,
  required String date,
}) async {
  await _request('POST', '/logs', body: {
    'foodId': foodId,
    'quantity': quantity,
    'meal': meal,
    'date': date,
  });
}

/// Update an existing log entry's quantity or meal.
Future<void> updateLog(String id, {double? quantity, String? meal}) async {
  final body = <String, dynamic>{};
  if (quantity != null) body['quantity'] = quantity;
  if (meal != null) body['meal'] = meal;
  await _request('PUT', '/logs/$id', body: body);
}

Future<void> deleteLog(String id) async {
  await _request('DELETE', '/logs/$id');
}

// ─── Water ───────────────────────────────────────────────────────

Future<DailyWater> getWater(String date) async {
  final data = await _request('GET', '/water?date=$date');
  return DailyWater.fromJson(data);
}

Future<DailyWater> addWater(double amountMl, String date) async {
  await _request('POST', '/water', body: {'amountMl': amountMl, 'date': date});
  // POST returns the single entry — refetch to get updated total + entries list
  return getWater(date);
}

Future<void> deleteWater(String id) async {
  await _request('DELETE', '/water/$id');
}

// ─── Targets ─────────────────────────────────────────────────────

Future<Targets?> getTargets() async {
  final data = await _request('GET', '/targets');
  if (data == null) return null;
  return Targets.fromJson(data);
}

Future<Targets> setTargets({
  required double calorieTarget,
  required double proteinTarget,
  required double carbTarget,
  required double fatTarget,
}) async {
  final data = await _request('PUT', '/targets', body: {
    'calorieTarget': calorieTarget,
    'proteinTarget': proteinTarget,
    'carbTarget': carbTarget,
    'fatTarget': fatTarget,
  });
  return Targets.fromJson(data);
}

/// Fetch server-calculated targets from biometrics + current goal.
/// Mirrors GET /api/targets/suggested on the backend.
Future<Targets> getSuggestedTargets() async {
  final data = await _request('GET', '/targets/suggested');
  return Targets.fromJson(data);
}

// ─── Progress ────────────────────────────────────────────────────

Future<void> logWeight(double weightKg, {String? date}) async {
  await _request('POST', '/progress/weight', body: {
    'weightKg': weightKg,
    'date': date ?? todayString(),
  });
}

Future<List<WeightEntry>> getWeightHistory({int range = 30}) async {
  final data = await _request('GET', '/progress/weight?range=$range');
  return ((data['entries'] ?? []) as List)
      .map((e) => WeightEntry.fromJson(e))
      .toList();
}

Future<List<DailySummary>> getProgressSummary({int range = 30}) async {
  final data = await _request('GET', '/progress/summary?range=$range');
  return ((data['summary'] ?? []) as List)
      .map((e) => DailySummary.fromJson(e))
      .toList();
}
