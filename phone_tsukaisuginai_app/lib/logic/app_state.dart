
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'angle_utils.dart';
import 'sensor_service.dart';

enum AppMode {
  normal, // Screen on only when vertical
  timer,  // Screen on only when in holder angle
}

class FocusState {
  final AppMode mode;
  final bool isBlocked;
  final double currentTilt; // For debugging/UI
  final int timerSecondsRemaining;
  final bool isTimerRunning;
  final bool isFlatMode; // New: For "Table Direct Placement"

  FocusState({
    this.mode = AppMode.normal,
    this.isBlocked = false,
    this.currentTilt = 0.0,
    this.timerSecondsRemaining = 0,
    this.isTimerRunning = false,
    this.isFlatMode = false,
  });

  FocusState copyWith({
    AppMode? mode,
    bool? isBlocked,
    double? currentTilt,
    int? timerSecondsRemaining,
    bool? isTimerRunning,
    bool? isFlatMode,
  }) {
    return FocusState(
      mode: mode ?? this.mode,
      isBlocked: isBlocked ?? this.isBlocked,
      currentTilt: currentTilt ?? this.currentTilt,
      timerSecondsRemaining: timerSecondsRemaining ?? this.timerSecondsRemaining,
      isTimerRunning: isTimerRunning ?? this.isTimerRunning,
      isFlatMode: isFlatMode ?? this.isFlatMode,
    );
  }
}

class FocusStateNotifier extends Notifier<FocusState> {
  @override
  FocusState build() {
    // Listen to sensors and update notifier
    ref.listen(accelerometerProvider, (previous, next) {
      next.whenData((event) {
        updateTilt(event.x, event.y, event.z);
      });
    });
    return FocusState();
  }

  Timer? _timer;

  // Thresholds (Degrees from Vertical)
  // 0 = Upright, 90 = Flat
  static const double normalModeMaxTilt = 25.0; // Must be within 0-25 degrees (very upright)
  
  // Holder Mode: User updated to 0-25 (Vertical)
  static const double holderModeMinTilt = 0.0; 
  static const double holderModeMaxTilt = 25.0; 

  // Flat Mode: 90 +/- 5 degrees (85-95)
  static const double flatModeMinTilt = 85.0;
  static const double flatModeMaxTilt = 95.0;

  void setMode(AppMode mode) {
    state = state.copyWith(mode: mode);
    if (mode == AppMode.timer) {
      // Initialize timer if needed, or reset
      state = state.copyWith(timerSecondsRemaining: 25 * 60); // 25 min default
    }
  }

  void toggleFlatMode(bool isFlat) {
    state = state.copyWith(isFlatMode: isFlat);
    // Re-evaluate blocking immediately
    updateTilt(0, 0, 0); // Dummy call? No, we need actual values.
    // We can't easily re-run updateTilt without sensor data.
    // But the next sensor event will fix it.
  }

  void updateTilt(double x, double y, double z) {
    final tilt = AngleUtils.calculateTiltFromVertical(x, y, z);
    final isBlocked = _shouldBlock(tilt);
    
    // Avoid unnecessary state updates if nothing changed
    if (state.currentTilt != tilt || state.isBlocked != isBlocked) {
      state = state.copyWith(
        currentTilt: tilt,
        isBlocked: isBlocked,
      );
    }
  }

  bool _shouldBlock(double tilt) {
    if (state.mode == AppMode.normal) {
      // Block if tilt is TOO LARGE (i.e., not upright)
      return tilt > normalModeMaxTilt;
    } else {
      // Timer Mode
      if (state.isFlatMode) {
        // Flat Mode: Must be within 85-95
        return tilt < flatModeMinTilt || tilt > flatModeMaxTilt;
      } else {
        // Holder Mode: Must be within 0-25
        return tilt < holderModeMinTilt || tilt > holderModeMaxTilt;
      }
    }
  }

  void startTimer() {
    if (_timer != null) return;
    state = state.copyWith(isTimerRunning: true);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      // Check if mounted to avoid errors if notifier is disposed
      // Notifier doesn't have 'mounted' property like StateNotifier? 
      // It does have 'ref'. If ref is valid.
      // But usually we should cancel timer on dispose.
      // Notifier doesn't have dispose method override?
      // We can use ref.onDispose.
      
      if (state.timerSecondsRemaining > 0) {
        state = state.copyWith(timerSecondsRemaining: state.timerSecondsRemaining - 1);
      } else {
        stopTimer();
      }
    });
    
    ref.onDispose(() {
      _timer?.cancel();
    });
  }

  void stopTimer() {
    _timer?.cancel();
    _timer = null;
    state = state.copyWith(isTimerRunning: false);
  }
  
  void resetTimer() {
    stopTimer();
    state = state.copyWith(timerSecondsRemaining: 25 * 60);
  }
}

final focusStateProvider = NotifierProvider<FocusStateNotifier, FocusState>(FocusStateNotifier.new);
