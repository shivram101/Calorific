// login_screen.dart — port of mobile/src/app/login.tsx.
// Cream page, white card, "Good to see you again, friend."

import 'package:flutter/material.dart';
import '../api/client.dart' as api;
import '../theme.dart';
import 'home_shell.dart';
import 'signup_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String _error = '';

  Future<void> _handleLogin() async {
    if (_email.text.isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Enter your email and password');
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      await api.login(_email.text.trim(), _password.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeShell()),
      );
    } on api.ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the server.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _fieldDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.faint, fontSize: 14),
      filled: true,
      fillColor: AppColors.cream,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Welcome pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryTint,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('🌱 Welcome back',
                    style: TextStyle(
                        color: AppColors.greenDark,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 14),
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                      height: 1.25),
                  children: [
                    TextSpan(text: 'Good to see you\nagain, '),
                    TextSpan(
                        text: 'friend.',
                        style: TextStyle(color: AppColors.primary)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Log in to keep tracking your meals, macros,\nand progress right where you left off.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 24),

              // Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: cardDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error.isNotEmpty) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.errorTint,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(_error,
                            style: const TextStyle(
                                color: AppColors.error, fontSize: 12)),
                      ),
                      const SizedBox(height: 12),
                    ],
                    const Text('Email',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: _fieldDecoration('you@example.com'),
                    ),
                    const SizedBox(height: 14),
                    const Text('Password',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _password,
                      obscureText: !_showPassword,
                      decoration: _fieldDecoration('••••••••').copyWith(
                        suffixIcon: TextButton(
                          onPressed: () =>
                              setState(() => _showPassword = !_showPassword),
                          child: Text(_showPassword ? 'Hide' : 'Show',
                              style: const TextStyle(
                                  color: AppColors.primary, fontSize: 12)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _loading ? null : _handleLogin,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text(_loading ? 'Logging in...' : 'Log in',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 15)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Center(
                      child: GestureDetector(
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => const SignupScreen()),
                        ),
                        child: RichText(
                          text: const TextSpan(
                            style: TextStyle(
                                fontSize: 12, color: AppColors.muted),
                            children: [
                              TextSpan(text: "Don't have an account? "),
                              TextSpan(
                                  text: 'Sign up',
                                  style: TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
