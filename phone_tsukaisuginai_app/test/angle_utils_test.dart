import 'dart:math';
import 'package:flutter_test/flutter_test.dart';
import 'package:phone_tsukaisuginai_app/logic/angle_utils.dart';

void main() {
  group('AngleUtils', () {
    test('calculateTiltFromVertical returns 0 for upright position', () {
      // Upright: x=0, y=9.8, z=0 (assuming Y is up/down axis and gravity pulls down)
      // Wait, if phone is upright, gravity acts on Y axis.
      // If Y axis points UP, gravity is -9.8.
      // If Y axis points DOWN, gravity is 9.8.
      // Standard Android: Y points UP. So gravity is -9.8 on Y axis.
      // Let's check the logic in AngleUtils.
      // It calculates angle between vector (x,y,z) and Y-axis (0,1,0).
      
      // If phone is upright (Portrait), gravity vector relative to device is (0, 9.8, 0) 
      // (This means the device is accelerating UP relative to freefall? No.)
      // Accelerometer measures Proper Acceleration.
      // Sitting on table: Z axis reads +9.8 (Table pushes up).
      // Standing upright: Y axis reads +9.8 (Table pushes up on bottom edge).
      
      // So Upright = (0, 9.8, 0).
      final tilt = AngleUtils.calculateTiltFromVertical(0, 9.8, 0);
      expect(tilt, closeTo(0, 0.1));
    });

    test('calculateTiltFromVertical returns 90 for flat position', () {
      // Flat: x=0, y=0, z=9.8
      final tilt = AngleUtils.calculateTiltFromVertical(0, 0, 9.8);
      expect(tilt, closeTo(90, 0.1));
    });

    test('calculateTiltFromVertical returns 45 for 45 degree tilt', () {
      // 45 degrees: Y and Z components are equal.
      final tilt = AngleUtils.calculateTiltFromVertical(0, 1, 1);
      expect(tilt, closeTo(45, 0.1));
    });

    test('calculateTiltFromVertical handles upside down', () {
      // Upside down: Y = -9.8
      final tilt = AngleUtils.calculateTiltFromVertical(0, -9.8, 0);
      expect(tilt, closeTo(180, 0.1));
    });
  });
}
