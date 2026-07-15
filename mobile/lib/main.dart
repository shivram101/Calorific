// lib/main.dart
// Calorific — Flutter mobile app entry point.
// Theme matches the web app: cream background, green accent, soft cards.

import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/diary_screen.dart';
import 'screens/food_detail_screen.dart';
import 'screens/custom_food_screen.dart';
import 'screens/barcode_screen.dart';
import 'screens/goals_screen.dart';
import 'screens/trends_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/micro_detail_screen.dart';

// ─── Calorific color palette (matches web frontend) ─────────────
class CalorificColors {
  static const cream = Color(0xFFFFF8ED);      // page background
  static const green = Color(0xFF1FA873);      // primary accent
  static const greenDark = Color(0xFF0F6E56);  // dark green text
  static const greenLight = Color(0xFFE1F5EE); // light green backgrounds
  static const textDark = Color(0xFF2D2A26);   // primary text
  static const textMuted = Color(0xFF8A8378);  // secondary text
  static const textFaint = Color(0xFFC7C2B8);  // placeholder text
  static const protein = Color(0xFFDC4C3F);    // red
  static const carbs = Color(0xFFEF9F27);      // orange
  static const fat = Color(0xFF378ADD);        // blue
  static const danger = Color(0xFFDC4C3F);
  static const dangerLight = Color(0xFFFDF0EE);
}

void main() {
  runApp(const CalorificApp());
}

class CalorificApp extends StatelessWidget {
  const CalorificApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Calorific',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: CalorificColors.cream,
        colorScheme: ColorScheme.fromSeed(
          seedColor: CalorificColors.green,
          surface: CalorificColors.cream,
        ),
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: CalorificColors.textDark,
          elevation: 0,
          centerTitle: false,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: CalorificColors.green,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: CalorificColors.cream,
          hintStyle: const TextStyle(color: CalorificColors.textFaint, fontSize: 13),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: CalorificColors.green, width: 1.5),
          ),
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withOpacity(0.05),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignupScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/diary': (context) => const DiaryScreen(),
        '/custom-food': (context) => const CustomFoodScreen(),
        '/barcode': (context) => const BarcodeScreen(),
        '/goals': (context) => const GoalsScreen(),
        '/trends': (context) => const TrendsScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/food-detail') {
          final args = settings.arguments as Map<String, dynamic>? ?? {};
          return MaterialPageRoute(
            builder: (context) => FoodDetailScreen(
              foodId: args['foodId'] ?? '',
              initialMeal: args['meal'],
            ),
          );
        }
        if (settings.name == '/micro-detail') {
          final args = settings.arguments as Map<String, dynamic>? ?? {};
          return MaterialPageRoute(
            builder: (context) => MicroDetailScreen(
              foodId: args['foodId'] ?? '',
              foodName: args['foodName'] ?? '',
            ),
          );
        }
        return null;
      },
    );
  }
}
