import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../logic/app_state.dart';
import '../../data/motivation_messages.dart';

class BlackoutOverlay extends ConsumerStatefulWidget {
  const BlackoutOverlay({super.key});

  @override
  ConsumerState<BlackoutOverlay> createState() => _BlackoutOverlayState();
}

class _BlackoutOverlayState extends ConsumerState<BlackoutOverlay> {
  String _currentMessage = "";
  bool _wasBlocked = false;

  @override
  Widget build(BuildContext context) {
    final isBlocked = ref.watch(focusStateProvider.select((s) => s.isBlocked));

    // Update message only when transitioning from Unblocked -> Blocked
    if (isBlocked && !_wasBlocked) {
      // Pick a new random message
      final random = Random();
      _currentMessage = motivationMessages[random.nextInt(motivationMessages.length)];
    }
    _wasBlocked = isBlocked;

    return IgnorePointer(
      ignoring: !isBlocked, // If NOT blocked, ignore touches (let them pass through)
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 300),
        opacity: isBlocked ? 1.0 : 0.0,
        child: Container(
          color: Colors.black,
          width: double.infinity,
          height: double.infinity,
          padding: const EdgeInsets.all(32),
          child: Center(
            child: isBlocked
                ? Text(
                    _currentMessage,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  )
                : null,
          ),
        ),
      ),
    );
  }
}
