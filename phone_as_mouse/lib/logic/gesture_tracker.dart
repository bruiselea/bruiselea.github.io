import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final gestureTrackerProvider = Provider((ref) => GestureTracker());

class GestureTracker {
  // Stream for movement updates (dx, dy)
  final _movementController = StreamController<Map<String, double>>.broadcast();
  Stream<Map<String, double>> get movementStream => _movementController.stream;

  // Stream for click events
  final _clickController = StreamController<String>.broadcast();
  Stream<String> get clickStream => _clickController.stream;

  Offset? _lastPosition;
  double _sensitivity = 2.0;

  void onPanStart(DragStartDetails details) {
    _lastPosition = details.localPosition;
  }

  void onPanUpdate(DragUpdateDetails details) {
    if (_lastPosition != null) {
      final dx = (details.localPosition.dx - _lastPosition!.dx) * _sensitivity;
      final dy = (details.localPosition.dy - _lastPosition!.dy) * _sensitivity;
      
      _movementController.add({'dx': dx, 'dy': dy});
      _lastPosition = details.localPosition;
    }
  }

  void onPanEnd(DragEndDetails details) {
    _lastPosition = null;
  }

  void onTap() {
    _clickController.add('left');
  }

  void onLongPress() {
    _clickController.add('right');
  }

  void onDoubleTap() {
    _clickController.add('double');
  }

  void setSensitivity(double sensitivity) {
    _sensitivity = sensitivity;
  }

  void dispose() {
    _movementController.close();
    _clickController.close();
  }
}
