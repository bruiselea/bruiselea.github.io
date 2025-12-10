import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../logic/app_state.dart';
import 'timer_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(focusStateProvider.select((s) => s.mode));
    final currentTilt = ref.watch(focusStateProvider.select((s) => s.currentTilt));

    return Scaffold(
      appBar: AppBar(
        title: const Text('TiltGuard'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildStatusCard(context, mode, currentTilt),
            const SizedBox(height: 30),
            const Text(
              'Select Mode',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            _buildModeButton(
              context,
              ref,
              title: 'Normal Mode',
              description: 'Screen on only when held vertically.',
              isSelected: mode == AppMode.normal,
              onTap: () {
                ref.read(focusStateProvider.notifier).setMode(AppMode.normal);
              },
            ),
            const SizedBox(height: 10),
            _buildModeButton(
              context,
              ref,
              title: 'Timer Mode',
              description: 'Screen on only when in holder (Study).',
              isSelected: mode == AppMode.timer,
              onTap: () {
                ref.read(focusStateProvider.notifier).setMode(AppMode.timer);
                ref.read(focusStateProvider.notifier).startTimer();
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const TimerScreen()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context, AppMode mode, double tilt) {
    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Current Tilt', style: TextStyle(fontSize: 14)),
            Text(
              '${tilt.toStringAsFixed(1)}°',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              mode == AppMode.normal ? 'Target: < 25° (Vertical)' : 'Target: 25° - 60° (Holder)',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeButton(
    BuildContext context,
    WidgetRef ref, {
    required String title,
    required String description,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey.shade300,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? Colors.blue.withValues(alpha: 0.1) : null,
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.check_circle : Icons.circle_outlined,
              color: isSelected ? Colors.blue : Colors.grey,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.blue : Colors.black,
                    ),
                  ),
                  Text(
                    description,
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
