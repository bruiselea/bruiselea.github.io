import 'dart:math';

class AngleUtils {
  /// Calculates the pitch (tilt up/down) in degrees from accelerometer data.
  /// Returns a value between -180 and 180.
  /// 
  /// - 0 degrees: Flat on table (Screen up)
  /// - 90 degrees: Upright (Vertical, Portrait)
  /// - -90 degrees: Upside down (Vertical, Portrait)
  /// 
  /// Note: This is a simplified calculation assuming the device is mostly in portrait mode.
  static double calculatePitch(double x, double y, double z) {
    // Calculate pitch using atan2
    // y is usually gravity when upright. z is gravity when flat.
    // We want 0 when flat (z=g, y=0) and 90 when upright (y=g, z=0).
    
    // Standard formula: pitch = atan2(y, z) * 180/PI
    // If flat: y=0, z=9.8 -> atan2(0, 9.8) = 0
    // If upright: y=9.8, z=0 -> atan2(9.8, 0) = 90
    
    // Note: Sensor data direction depends on OS. 
    // Android: +Y is up (towards top of screen)? No, usually +Y is towards top of device.
    // If device is upright, Gravity is pulling DOWN (-Y). So Y reads -9.8.
    // If device is flat, Gravity is pulling DOWN (-Z). So Z reads 9.8 (force of table pushing up) or -9.8?
    // Standard Android Accelerometer:
    // Flat on table: Z = +9.8 (Earth gravity pulls down, but sensor measures proper acceleration relative to free fall. So table pushes up.)
    // Upright: Y = +9.8 (if standing on bottom edge).
    
    // Let's use the standard vector math.
    // We care about the angle of the Z-axis (screen normal) relative to the horizontal plane?
    // Or the Y-axis relative to the vertical?
    
    // Let's use simple atan2(y, z) for now and refine if needed.
    // We want absolute tilt from flat.
    
    double radians = atan2(y, z);
    double degrees = radians * (180 / pi);
    return degrees;
  }

  /// Calculates the absolute tilt angle from the vertical axis (0 = Upright, 90 = Flat).
  /// This might be more intuitive for "Vertical Mode".
  static double calculateTiltFromVertical(double x, double y, double z) {
    // Magnitude of the vector
    double norm = sqrt(x*x + y*y + z*z);
    
    // If we assume Y axis is the long axis of the phone.
    // We want the angle between Y-axis and the Gravity vector.
    // Gravity vector is roughly (0, 0, 9.8) in world coordinates, but the sensor gives us the gravity vector in DEVICE coordinates.
    // So the sensor reading IS the gravity vector (plus linear acceleration).
    // If the reading is (0, 9.8, 0), it means the Y-axis is aligned with gravity (Upright).
    
    // We want the angle between the Y-axis vector (0,1,0) and the sensor vector (x,y,z).
    // Dot product: (0*x + 1*y + 0*z) = y
    // Cos(theta) = y / norm
    // theta = acos(y / norm)
    
    if (norm == 0) return 0;
    
    // y component relative to total force
    double cosTheta = y / norm;
    
    // Clamp to -1.0 to 1.0 to avoid NaN errors
    cosTheta = max(-1.0, min(1.0, cosTheta));
    
    double radians = acos(cosTheta);
    double degrees = radians * (180 / pi);
    
    // degrees is 0 if Y is aligned with gravity (Upright, but upside down? or right side up?)
    // If Y = 9.8 (Upright), degrees = 0.
    // If Y = -9.8 (Upside down), degrees = 180.
    // If Y = 0 (Flat), degrees = 90.
    
    return degrees;
  }
}
