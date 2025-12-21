import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'ui/home_screen.dart';
import 'ui/components/blackout_overlay.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Enable wakelock to keep the app running (since we simulate screen off)
  WakelockPlus.enable();
  
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TiltGuard',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      // This builder allows us to place the BlackoutOverlay on top of EVERY screen
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            const BlackoutOverlay(),
          ],
        );
      },
      home: const HomeScreen(),
    );
  }
}
