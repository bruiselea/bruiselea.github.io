import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../logic/app_state.dart';

class TimerScreen extends ConsumerWidget {
  const TimerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timerSeconds = ref.watch(focusStateProvider.select((s) => s.timerSecondsRemaining));
    final currentTilt = ref.watch(focusStateProvider.select((s) => s.currentTilt));
    
    final minutes = (timerSeconds / 60).floor();
    final seconds = timerSeconds % 60;
    final timeStr = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Focus Timer'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            ref.read(focusStateProvider.notifier).stopTimer();
            Navigator.of(context).pop();
          },
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Circular Timer
            SizedBox(
              width: 250,
              height: 250,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CircularProgressIndicator(
                    value: timerSeconds / (25 * 60), // Assuming 25 min max
                    strokeWidth: 12,
                    backgroundColor: Colors.grey.shade200,
                    color: Colors.blue,
                    strokeCap: StrokeCap.round,
                  ),
                  Center(
                    child: Text(
                      timeStr,
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontFeatures: [const FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
            const Text('Place phone in holder (approx 0-25°)'),
            const SizedBox(height: 10),
            Text(
              'Current Tilt: ${currentTilt.toStringAsFixed(1)}°',
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 20),
            // Flat Mode Toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: SwitchListTile(
                title: const Text('Table Direct Placement'),
                subtitle: const Text('Allow flat usage (approx 90°)'),
                value: ref.watch(focusStateProvider.select((s) => s.isFlatMode)),
                onChanged: (value) {
                  ref.read(focusStateProvider.notifier).toggleFlatMode(value);
                },
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                ref.read(focusStateProvider.notifier).stopTimer();
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              ),
              child: const Text('Stop Session'),
            ),
          ],
        ),
      ),
    );
  }
}
