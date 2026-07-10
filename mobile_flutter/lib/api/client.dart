// api/client.dart — Calorific API client.
// Direct port of mobile/src/api/client.ts (React Native version):
// same endpoints, same shapes. Uses shared_preferences for the JWT
// (Flutter's equivalent of AsyncStorage).

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Droplet IP for production — same value as the RN client.
// For local dev on a physical device use your machine's LAN IP.
const String baseUrl = 'http://157.230.230.192/api';

// ─── Token helpers ──────────────────────────────────────────────────────────

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

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

// ─── Base request wrapper ───────────────────────────────────────────────────

Future<dynamic> request(
  String method,
  String path, {
  Map<String, dynamic>? body,
  bool auth = true,
}) async {
  final headers = <String, String>{'Content-Type': 'application/json'};
  if (auth) {
    final token = await getToken();
    if (token != null) headers['Authorization'] = 'Bearer $token';
  }

  final uri = Uri.parse('$baseUrl$path');
  late http.Response res;
  switch (method) {
    case 'GET':
      res = await http.get(uri, headers: headers);
    case 'POST':
      res = await http.post(uri, headers: headers, body: jsonEncode(body));
    case 'PUT':
      res = await http.put(uri, headers: headers, body: jsonEncode(body));
    case 'DELETE':
      res = await http.delete(uri, headers: headers);
    default:
      throw ArgumentError('Unsupported method $method');
  }

  final data = res.body.isEmpty ? null : jsonDecode(res.body);
  if (res.statusCode < 200 || res.statusCode >= 300) {
    final msg = (data is Map && data['error'] != null)
        ? data['error'] as String
        : 'Something went wrong';
    throw ApiException(msg, res.statusCode);
  }
  return data;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

Future<Map<String, dynamic>> register(
    String email, String password, String firstName, String lastName) async {
  return await request('POST', '/register', auth: false, body: {
    'email': email,
    'password': password,
    'firstName': firstName,
    'lastName': lastName,
  }) as Map<String, dynamic>;
}

Future<Map<String, dynamic>> login(String email, String password) async {
  final data = await request('POST', '/login', auth: false, body: {
    'email': email,
    'password': password,
  }) as Map<String, dynamic>;
  if (data['token'] != null) await setToken(data['token'] as String);
  return data;
}

Future<void> logout() async => clearToken();

Future<void> forgotPassword(String email) async {
  await request('POST', '/forgot-password', auth: false, body: {'email': email});
}

Future<void> resetPassword(String token, String password) async {
  await request('POST', '/reset-password/$token',
      auth: false, body: {'password': password});
}

Future<void> verifyEmail(String token) async {
  await request('GET', '/verify-email/$token', auth: false);
}

// ─── Profile ────────────────────────────────────────────────────────────────

class UserProfile {
  final String? firstName, lastName, email, sex, activityLevel, goal;
  final num? heightCm, weightKg, age;
  UserProfile.fromJson(Map<String, dynamic> j)
      : firstName = j['firstName'] as String?,
        lastName = j['lastName'] as String?,
        email = j['email'] as String?,
        sex = j['sex'] as String?,
        activityLevel = j['activityLevel'] as String?,
        goal = j['goal'] as String?,
        heightCm = j['heightCm'] as num?,
        weightKg = j['weightKg'] as num?,
        age = j['age'] as num?;
}

Future<UserProfile> getProfile() async {
  return UserProfile.fromJson(
      await request('GET', '/profile') as Map<String, dynamic>);
}

Future<void> updateProfile(Map<String, dynamic> updates) async {
  await request('PUT', '/profile', body: updates);
}

Future<void> deleteAccount() async {
  await request('DELETE', '/account');
}

// ─── Foods ──────────────────────────────────────────────────────────────────

class Food {
  final String id, name;
  final String? brand, servingSize;
  final num calories, protein, carbs, fat;
  Food.fromJson(Map<String, dynamic> j)
      : id = (j['_id'] ?? j['id'] ?? '').toString(),
        name = (j['name'] ?? '') as String,
        brand = j['brand'] as String?,
        servingSize = j['servingSize']?.toString(),
        calories = (j['calories'] ?? 0) as num,
        protein = (j['protein'] ?? 0) as num,
        carbs = (j['carbs'] ?? 0) as num,
        fat = (j['fat'] ?? 0) as num;
}

Future<List<Food>> searchFoods(String query) async {
  final data = await request(
      'GET', '/foods/search?query=${Uri.encodeComponent(query)}');
  final list = data is List ? data : (data['foods'] ?? data['results'] ?? []);
  return (list as List)
      .map((e) => Food.fromJson(e as Map<String, dynamic>))
      .toList();
}

Future<Food> getFoodDetail(String id) async {
  return Food.fromJson(
      await request('GET', '/foods/$id') as Map<String, dynamic>);
}

Future<Food> getFoodByBarcode(String upc) async {
  return Food.fromJson(
      await request('GET', '/foods/barcode/$upc') as Map<String, dynamic>);
}

Future<Food> createCustomFood(Map<String, dynamic> food) async {
  return Food.fromJson(
      await request('POST', '/foods/custom', body: food) as Map<String, dynamic>);
}

// ─── Logs ───────────────────────────────────────────────────────────────────

String todayString() {
  final now = DateTime.now().toUtc();
  return now.toIso8601String().substring(0, 10);
}

class LogEntry {
  final String id, foodName, meal;
  final num quantity, calories, protein, carbs, fat;
  LogEntry.fromJson(Map<String, dynamic> j)
      : id = (j['_id'] ?? '').toString(),
        foodName = (j['foodName'] ?? j['name'] ?? '') as String,
        meal = (j['meal'] ?? 'breakfast') as String,
        quantity = (j['quantity'] ?? 1) as num,
        calories = (j['calories'] ?? 0) as num,
        protein = (j['protein'] ?? 0) as num,
        carbs = (j['carbs'] ?? 0) as num,
        fat = (j['fat'] ?? 0) as num;
}

class DailyTotals {
  final num calories, protein, carbs, fat;
  const DailyTotals(
      {this.calories = 0, this.protein = 0, this.carbs = 0, this.fat = 0});
  DailyTotals.fromJson(Map<String, dynamic> j)
      : calories = (j['calories'] ?? 0) as num,
        protein = (j['protein'] ?? 0) as num,
        carbs = (j['carbs'] ?? 0) as num,
        fat = (j['fat'] ?? 0) as num;
}

class DailyLog {
  final List<LogEntry> entries;
  final DailyTotals totals;
  DailyLog.fromJson(Map<String, dynamic> j)
      : entries = ((j['entries'] ?? []) as List)
            .map((e) => LogEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
        totals = j['totals'] != null
            ? DailyTotals.fromJson(j['totals'] as Map<String, dynamic>)
            : const DailyTotals();
}

Future<DailyLog> getLogs(String date) async {
  return DailyLog.fromJson(
      await request('GET', '/logs?date=$date') as Map<String, dynamic>);
}

Future<void> addLog(Map<String, dynamic> entry) async {
  await request('POST', '/logs', body: entry);
}

Future<void> updateLog(String id, Map<String, dynamic> updates) async {
  await request('PUT', '/logs/$id', body: updates);
}

Future<void> deleteLog(String id) async {
  await request('DELETE', '/logs/$id');
}

// ─── Water ──────────────────────────────────────────────────────────────────

Future<int> getWater(String date) async {
  final data = await request('GET', '/water?date=$date');
  return ((data['totalMl'] ?? 0) as num).toInt();
}

Future<void> addWater(int amountMl, String date) async {
  await request('POST', '/water', body: {'amountMl': amountMl, 'date': date});
}

// ─── Targets ────────────────────────────────────────────────────────────────

class Targets {
  final num calorieTarget, proteinTarget, carbTarget, fatTarget;
  Targets.fromJson(Map<String, dynamic> j)
      : calorieTarget = (j['calorieTarget'] ?? 0) as num,
        proteinTarget = (j['proteinTarget'] ?? 0) as num,
        carbTarget = (j['carbTarget'] ?? 0) as num,
        fatTarget = (j['fatTarget'] ?? 0) as num;
}

Future<Targets?> getTargets() async {
  final data = await request('GET', '/targets');
  if (data == null) return null;
  return Targets.fromJson(data as Map<String, dynamic>);
}

Future<Targets> setTargets({
  required num calorieTarget,
  required num proteinTarget,
  required num carbTarget,
  required num fatTarget,
}) async {
  return Targets.fromJson(await request('PUT', '/targets', body: {
    'calorieTarget': calorieTarget,
    'proteinTarget': proteinTarget,
    'carbTarget': carbTarget,
    'fatTarget': fatTarget,
  }) as Map<String, dynamic>);
}

// ─── Progress ───────────────────────────────────────────────────────────────

class WeightEntry {
  final String date;
  final num weightKg;
  WeightEntry.fromJson(Map<String, dynamic> j)
      : date = (j['date'] ?? '') as String,
        weightKg = (j['weightKg'] ?? 0) as num;
}

Future<void> logWeight(num weightKg, {String? date}) async {
  await request('POST', '/progress/weight',
      body: {'weightKg': weightKg, 'date': date ?? todayString()});
}

Future<List<WeightEntry>> getWeightHistory({int range = 30}) async {
  final data = await request('GET', '/progress/weight?range=$range');
  return ((data['entries'] ?? []) as List)
      .map((e) => WeightEntry.fromJson(e as Map<String, dynamic>))
      .toList();
}

class DailySummary {
  final String date;
  final num calories, protein, carbs, fat;
  DailySummary.fromJson(Map<String, dynamic> j)
      : date = (j['date'] ?? '') as String,
        calories = (j['calories'] ?? 0) as num,
        protein = (j['protein'] ?? 0) as num,
        carbs = (j['carbs'] ?? 0) as num,
        fat = (j['fat'] ?? 0) as num;
}

Future<List<DailySummary>> getProgressSummary({int range = 30}) async {
  final data = await request('GET', '/progress/summary?range=$range');
  return ((data['summary'] ?? []) as List)
      .map((e) => DailySummary.fromJson(e as Map<String, dynamic>))
      .toList();
}
