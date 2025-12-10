import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sensors_plus/sensors_plus.dart';

final accelerometerTrackerProvider = Provider((ref) => AccelerometerTracker());

class AccelerometerTracker {
  StreamSubscription<AccelerometerEvent>? _subscription;
  
  // Stream for movement updates (dx, dy)
  final _movementController = StreamController<Map<String, double>>.broadcast();
  Stream<Map<String, double>> get movementStream => _movementController.stream;

  // Calibration offset (to account for phone not being perfectly level)
  double _offsetX = 0;
  double _offsetY = 0;
  
  // Sensitivity multiplier
  double _sensitivity = 20.0;

  void startTracking() {
    _subscription = accelerometerEvents.listen((AccelerometerEvent event) {
      // event.x: tilt left/right (negative = left, positive = right)
      // event.y: tilt forward/back (negative = forward, positive = back)
      // We'll use these to control cursor movement
      
      // Apply offset and sensitivity
      final dx = (event.x - _offsetX) * _sensitivity;
      final dy = (event.y - _offsetY) * _sensitivity;
      
      // Only emit if movement is significant
      if (dx.abs() > 1 || dy.abs() > 1) {
        _movementController.add({'dx': dx, 'dy': dy});
      }
    });
  }

  void stopTracking() {
    _subscription?.cancel();
    _subscription = null;
  }

  void calibrate(double x, double y) {
    _offsetX = x;
    _offsetY = y;
  }

  void setSensitivity(double sensitivity) {
    _sensitivity = sensitivity;
  }

  void dispose() {
    _subscription?.cancel();
    _movementController.close();
  }
}
