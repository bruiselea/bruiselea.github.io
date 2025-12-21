import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phone_tsukaisuginai_app/logic/app_state.dart';
import 'package:phone_tsukaisuginai_app/logic/sensor_service.dart';
import 'package:sensors_plus/sensors_plus.dart';

// Mock Provider to override sensor stream
final mockAccelerometerProvider = StreamProvider<AccelerometerEvent>((ref) {
  return const Stream.empty();
});

void main() {
  group('FocusStateNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer(
        overrides: [
          accelerometerProvider.overrideWith((ref) => const Stream.empty()),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('Initial state is Normal Mode and Not Blocked (assuming 0 tilt)', () {
      final state = container.read(focusStateProvider);
      expect(state.mode, AppMode.normal);
      expect(state.isBlocked, false);
    });

    test('Normal Mode blocks when tilt > 25', () {
      final notifier = container.read(focusStateProvider.notifier);
      
      // Simulate 30 degrees tilt (Blocked)
      // x=0, y=cos(30), z=sin(30)
      // 30 deg = 0.52 rad. cos=0.866, sin=0.5
      notifier.updateTilt(0, 0.866, 0.5);
      
      expect(container.read(focusStateProvider).isBlocked, true);
      expect(container.read(focusStateProvider).currentTilt, closeTo(30, 1.0));
    });

    test('Normal Mode does not block when tilt < 25', () {
      final notifier = container.read(focusStateProvider.notifier);
      
      // Simulate 10 degrees tilt (Allowed)
      // x=0, y=cos(10), z=sin(10)
      notifier.updateTilt(0, 0.98, 0.17);
      
      expect(container.read(focusStateProvider).isBlocked, false);
    });

    test('Timer Mode blocks when tilt is outside 0-25 range', () {
      final notifier = container.read(focusStateProvider.notifier);
      notifier.setMode(AppMode.timer);
      
      // 10 degrees (Inside 0-25) -> Allowed
      notifier.updateTilt(0, 0.98, 0.17);
      expect(container.read(focusStateProvider).isBlocked, false);

      // 45 degrees (Outside 0-25) -> Blocked
      notifier.updateTilt(0, 0.707, 0.707);
      expect(container.read(focusStateProvider).isBlocked, true);

      // 80 degrees (Too flat) -> Blocked
      notifier.updateTilt(0, 0.17, 0.98);
      expect(container.read(focusStateProvider).isBlocked, true);
    });

    test('Timer Mode with Flat Mode enabled allows 85-95 range', () {
      final notifier = container.read(focusStateProvider.notifier);
      notifier.setMode(AppMode.timer);
      notifier.toggleFlatMode(true);
      
      // 90 degrees (Perfect Flat) -> Allowed
      notifier.updateTilt(0, 0, 1);
      expect(container.read(focusStateProvider).isBlocked, false);

      // 80 degrees (Too steep for Flat Mode) -> Blocked
      notifier.updateTilt(0, 0.17, 0.98);
      expect(container.read(focusStateProvider).isBlocked, true);

      // 0 degrees (Upright) -> Blocked in Flat Mode
      notifier.updateTilt(0, 1, 0);
      expect(container.read(focusStateProvider).isBlocked, true);
    });

    test('Timer starts and counts down', () async {
      final notifier = container.read(focusStateProvider.notifier);
      notifier.setMode(AppMode.timer);
      notifier.startTimer();
      
      expect(container.read(focusStateProvider).isTimerRunning, true);
      
      // Wait for 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      
      final remaining = container.read(focusStateProvider).timerSecondsRemaining;
      expect(remaining, lessThan(25 * 60));
    });
  });
}
