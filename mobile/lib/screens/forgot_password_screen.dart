// lib/screens/forgot_password_screen.dart
// Forgot password — sends reset email via POST /api/forgot-password.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _sent = false;
  bool _loading = false;
  String? _error;

  Future<void> _handleSubmit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await forgotPassword(_emailController.text.trim());
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CalorificColors.cream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 380),
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.07),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  if (!_sent) ...[
                    const Text('🔑', style: TextStyle(fontSize: 36)),
                    const SizedBox(height: 8),
                    const Text('Forgot password?',
                        style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w600,
                            color: CalorificColors.textDark)),
                    const SizedBox(height: 4),
                    const Text(
                      "No worries, we'll send you reset instructions",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12, color: CalorificColors.textMuted),
                    ),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: CalorificColors.dangerLight,
                          border: Border.all(color: CalorificColors.danger),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_error!,
                            style: const TextStyle(
                                color: CalorificColors.danger, fontSize: 13)),
                      ),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: const Text('Email address',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: CalorificColors.textDark)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration:
                          const InputDecoration(hintText: 'you@example.com'),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _handleSubmit,
                        child:
                            Text(_loading ? 'Sending...' : 'Reset password'),
                      ),
                    ),
                  ] else ...[
                    const Text('📩', style: TextStyle(fontSize: 36)),
                    const SizedBox(height: 12),
                    const Text('Check your email',
                        style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w600,
                            color: CalorificColors.textDark)),
                    const SizedBox(height: 8),
                    Text(
                      "We've sent a reset link to\n${_emailController.text}",
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 13,
                          color: CalorificColors.textMuted,
                          height: 1.5),
                    ),
                  ],
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Text('← Back to log in',
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: CalorificColors.green)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
}
