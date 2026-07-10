// signup_screen.dart — port of mobile/src/app/signup.tsx.
// Register -> "check your email" state (verification link is emailed).

import 'package:flutter/material.dart';
import '../api/client.dart' as api;
import '../theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  bool _done = false;
  String _error = '';

  Future<void> _handleSignup() async {
    final name = _name.text.trim();
    if (name.isEmpty || _email.text.isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Fill in every field');
      return;
    }
    if (_password.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = "Passwords don't match");
      return;
    }
    final parts = name.split(' ');
    final firstName = parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      await api.register(_email.text.trim(), _password.text, firstName, lastName);
      setState(() => _done = true);
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

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.text)),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(
        backgroundColor: AppColors.cream,
        elevation: 0,
        leading: const BackButton(color: AppColors.text),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: cardDecoration(),
            child: _done ? _successBody() : _formBody(),
          ),
        ),
      ),
    );
  }

  Widget _successBody() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('📬', style: TextStyle(fontSize: 40)),
        const SizedBox(height: 10),
        const Text('Check your email',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.text)),
        const SizedBox(height: 6),
        Text(
          'We sent a verification link to\n${_email.text.trim()}.\nVerify, then come back and log in.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
          child: const Text('Back to log in'),
        ),
      ],
    );
  }

  Widget _formBody() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Center(
          child: Column(children: [
            Text('🥗', style: TextStyle(fontSize: 32)),
            SizedBox(height: 6),
            Text('Calorific',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text)),
            Text('Create your account',
                style: TextStyle(color: AppColors.muted, fontSize: 12)),
            SizedBox(height: 16),
          ]),
        ),
        if (_error.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.errorTint,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(_error,
                style: const TextStyle(color: AppColors.error, fontSize: 12)),
          ),
          const SizedBox(height: 12),
        ],
        _label('Full name'),
        TextField(controller: _name, decoration: _fieldDecoration('John Doe')),
        const SizedBox(height: 12),
        _label('Email address'),
        TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: _fieldDecoration('you@example.com')),
        const SizedBox(height: 12),
        _label('Password'),
        TextField(
            controller: _password,
            obscureText: true,
            decoration: _fieldDecoration('••••••••')),
        const SizedBox(height: 12),
        _label('Confirm password'),
        TextField(
            controller: _confirm,
            obscureText: true,
            decoration: _fieldDecoration('••••••••')),
        const SizedBox(height: 18),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _loading ? null : _handleSignup,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            child: Text(_loading ? 'Creating...' : 'Sign up',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15)),
          ),
        ),
      ],
    );
  }
}
