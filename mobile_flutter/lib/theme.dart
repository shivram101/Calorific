// theme.dart — Calorific design tokens, ported from the RN app.
// Cream background, white cards, green primary, macro accent trio.

import 'package:flutter/material.dart';

class AppColors {
  static const cream = Color(0xFFFFF8ED);
  static const surface = Color(0xFFFFFFFF);
  static const primary = Color(0xFF1FA873);
  static const primaryTint = Color(0xFFE1F5EE);
  static const greenDark = Color(0xFF085041);
  static const text = Color(0xFF2D2A26);
  static const muted = Color(0xFF8A8378);
  static const faint = Color(0xFFC7C2B8);
  static const track = Color(0xFFEFE9DE);
  static const sectionBg = Color(0xFFF9F7F4);
  static const error = Color(0xFFDC4C3F);
  static const errorTint = Color(0xFFFDF0EE);
  static const warning = Color(0xFFEF9F27);
  static const warningTint = Color(0xFFFAEEDA);
  static const warningDark = Color(0xFF854F0B);
  static const protein = Color(0xFFDC4C3F);
  static const carbs = Color(0xFFEF9F27);
  static const fat = Color(0xFF378ADD);
  static const fatTint = Color(0xFFEEF4FF);
  static const dashedBorder = Color(0xFFD5DDD8);
}

ThemeData buildCalorificTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.cream,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.text,
      elevation: 0,
    ),
    textTheme: const TextTheme(
      bodyMedium: TextStyle(color: AppColors.text),
    ),
  );
}

// Shared card decoration — white, rounded-2xl, soft shadow (matches RN cards).
BoxDecoration cardDecoration({Color color = AppColors.surface}) {
  return BoxDecoration(
    color: color,
    borderRadius: BorderRadius.circular(16),
    boxShadow: const [
      BoxShadow(color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, 2)),
    ],
  );
}
