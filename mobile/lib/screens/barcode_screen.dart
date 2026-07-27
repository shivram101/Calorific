// lib/screens/barcode_screen.dart
// Barcode scanner using mobile_scanner package.
// Scans a UPC, looks it up via GET /api/foods/barcode/:upc,
// then navigates to food-detail with the matched food.

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../api/client.dart';
import '../main.dart';

class BarcodeScreen extends StatefulWidget {
  const BarcodeScreen({super.key});

  @override
  State<BarcodeScreen> createState() => _BarcodeScreenState();
}

class _BarcodeScreenState extends State<BarcodeScreen> {
  bool _scanned = false;
  bool _loading = false;

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_scanned || _loading) return;
    final barcode = capture.barcodes.firstOrNull?.rawValue;
    if (barcode == null || barcode.isEmpty) return;

    setState(() {
      _scanned = true;
      _loading = true;
    });

    try {
      final food = await lookupBarcode(barcode);
      if (!mounted) return;
      await Navigator.pushNamed(context, '/food-detail',
          arguments: {'foodId': food.id});
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);

      final message = (e is ApiException && e.statusCode == 404)
          ? 'No food found for barcode $barcode. You can add it as a custom food.'
          : e.toString();

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Food not found'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() => _scanned = false);
              },
              child: const Text('Try again'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text('Go back'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            onDetect: _handleBarcode,
          ),

          // Overlay
          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.4),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.close, color: Colors.white),
                        ),
                      ),
                      const Text(
                        'Scan barcode',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),

                const Spacer(),

                // Viewfinder brackets
                SizedBox(
                  width: 260,
                  height: 160,
                  child: Stack(
                    children: [
                      _corner(
                          top: 0, left: 0, topBorder: true, leftBorder: true),
                      _corner(
                          top: 0, right: 0, topBorder: true, rightBorder: true),
                      _corner(
                          bottom: 0,
                          left: 0,
                          bottomBorder: true,
                          leftBorder: true),
                      _corner(
                          bottom: 0,
                          right: 0,
                          bottomBorder: true,
                          rightBorder: true),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                Text(
                  _loading ? 'Looking up food...' : 'Point at a food barcode',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),

                const Spacer(),

                if (_loading)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 60),
                    child:
                        CircularProgressIndicator(color: CalorificColors.green),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _corner({
    double? top,
    double? bottom,
    double? left,
    double? right,
    bool topBorder = false,
    bool bottomBorder = false,
    bool leftBorder = false,
    bool rightBorder = false,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          border: Border(
            top: topBorder
                ? const BorderSide(color: CalorificColors.green, width: 3)
                : BorderSide.none,
            bottom: bottomBorder
                ? const BorderSide(color: CalorificColors.green, width: 3)
                : BorderSide.none,
            left: leftBorder
                ? const BorderSide(color: CalorificColors.green, width: 3)
                : BorderSide.none,
            right: rightBorder
                ? const BorderSide(color: CalorificColors.green, width: 3)
                : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
