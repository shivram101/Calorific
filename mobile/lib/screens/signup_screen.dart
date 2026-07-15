// lib/screens/signup_screen.dart
// Sign up screen — splits full name into firstName/lastName for the API.

import 'package:flutter/material.dart';
import '../api/client.dart';
import '../main.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _success;

  static final RegExp _symbolPattern =
      RegExp(r'''[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~`]''');

  bool get _hasMinLength => _passwordController.text.length >= 8;
  bool get _hasUppercase => RegExp(r'[A-Z]').hasMatch(_passwordController.text);
  bool get _hasLowercase => RegExp(r'[a-z]').hasMatch(_passwordController.text);
  bool get _hasNumber => RegExp(r'[0-9]').hasMatch(_passwordController.text);
  bool get _hasSymbols =>
      _symbolPattern.allMatches(_passwordController.text).length >= 2;

  bool get _isPasswordValid =>
      _hasMinLength &&
      _hasUppercase &&
      _hasLowercase &&
      _hasNumber &&
      _hasSymbols;

  bool get _passwordsMatch =>
      _passwordController.text.isNotEmpty &&
      _passwordController.text == _confirmController.text;

  Future<void> _handleSignUp() async {
    setState(() {
      _error = null;
      _success = null;
    });

    if (!_isPasswordValid) {
      setState(() => _error = 'Password does not meet the requirements below');
      return;
    }

    if (!_passwordsMatch) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    // Split "John Doe" → firstName: "John", lastName: "Doe"
    final parts = _nameController.text.trim().split(' ');
    final firstName = parts.isNotEmpty ? parts.first : '';
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    setState(() => _loading = true);

    try {
      await register(
        _emailController.text.trim(),
        _passwordController.text,
        firstName,
        lastName,
      );
      setState(() =>
          _success = 'Account created! Please check your email to verify.');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: CalorificColors.textDark,
          ),
        ),
      );

  Widget _requirementRow(bool met, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle : Icons.circle_outlined,
            size: 14,
            color: met ? CalorificColors.green : CalorificColors.textMuted,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: met ? CalorificColors.green : CalorificColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  // Live checklist shown under the password field — updates as the person
  // types via the field's onChanged callback.
  Widget _passwordRequirements() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: CalorificColors.cream,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _requirementRow(_hasMinLength, 'At least 8 characters'),
          _requirementRow(_hasUppercase, 'One uppercase letter'),
          _requirementRow(_hasLowercase, 'One lowercase letter'),
          _requirementRow(_hasNumber, 'One number'),
          _requirementRow(_hasSymbols, 'Two or more symbols (!@#\$...)'),
        ],
      ),
    );
  }

  // Separate from the checklist above since it depends on both fields —
  // shown neutral until the person starts confirming, then green/red.
  Widget _matchIndicator() {
    final confirmEmpty = _confirmController.text.isEmpty;
    final icon = confirmEmpty
        ? Icons.circle_outlined
        : (_passwordsMatch ? Icons.check_circle : Icons.cancel);
    final color = confirmEmpty
        ? CalorificColors.textMuted
        : (_passwordsMatch ? CalorificColors.green : CalorificColors.danger);
    final label = confirmEmpty || _passwordsMatch
        ? 'Passwords match'
        : 'Passwords do not match';

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 11, color: color)),
        ],
      ),
    );
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Logo
                  const Center(
                    child: Column(
                      children: [
                        Text('🥗', style: TextStyle(fontSize: 36)),
                        SizedBox(height: 8),
                        Text(
                          'Calorific',
                          style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w600,
                            color: CalorificColors.textDark,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Create your account',
                          style: TextStyle(
                            fontSize: 12,
                            color: CalorificColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 26),

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
                      child: Text(
                        _error!,
                        style: const TextStyle(
                            color: CalorificColors.danger, fontSize: 13),
                      ),
                    ),

                  if (_success != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: CalorificColors.greenLight,
                        border: Border.all(color: CalorificColors.green),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _success!,
                        style: const TextStyle(
                            color: CalorificColors.greenDark, fontSize: 13),
                      ),
                    ),

                  _label('Full name'),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                        hintText:
                            'John'), // removing last name hint to avoid confusion
                  ),
                  const SizedBox(height: 14),

                  _label('Email address'),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    decoration:
                        const InputDecoration(hintText: 'you@example.com'),
                  ),
                  const SizedBox(height: 14),

                  _label('Password'),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(hintText: '••••••••'),
                  ),
                  const SizedBox(height: 10),
                  _passwordRequirements(),
                  const SizedBox(height: 14),

                  _label('Confirm password'),
                  TextField(
                    controller: _confirmController,
                    obscureText: true,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(hintText: '••••••••'),
                  ),
                  _matchIndicator(),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed:
                          (_loading || !_isPasswordValid || !_passwordsMatch)
                              ? null
                              : _handleSignUp,
                      child: Text(_loading ? 'Signing up...' : 'Sign Up'),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Already have an account? ',
                          style: TextStyle(
                            fontSize: 13,
                            color: CalorificColors.textMuted,
                          ),
                        ),
                        GestureDetector(
                          onTap: () =>
                              Navigator.pushReplacementNamed(context, '/login'),
                          child: const Text(
                            'Log In',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: CalorificColors.green,
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
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }
}
