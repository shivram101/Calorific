// main.dart — Calorific (Flutter port).
// App shell: auth gate -> login, or the bottom-tab home
// (Diary / Trends / Goals / Settings).

import 'package:flutter/material.dart';
import 'api/client.dart' as api;
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';

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
      theme: buildCalorificTheme(),
      home: const StartGate(),
    );
  }
}

/// Checks for a saved JWT and routes to login or the home tabs.
class StartGate extends StatefulWidget {
  const StartGate({super.key});

  @override
  State<StartGate> createState() => _StartGateState();
}

class _StartGateState extends State<StartGate> {
  bool? _loggedIn;

  @override
  void initState() {
    super.initState();
    api.getToken().then((t) {
      if (mounted) setState(() => _loggedIn = t != null);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loggedIn == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    return _loggedIn! ? const HomeShell() : const LoginScreen();
  }
}
