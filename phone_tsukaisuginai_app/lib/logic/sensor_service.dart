
import 'package:sensors_plus/sensors_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider for the raw accelerometer events
final accelerometerProvider = StreamProvider<AccelerometerEvent>((ref) {
  return accelerometerEventStream();
});

// We might want a smoothed provider if the raw data is too jittery
// For now, let's just expose the stream.
