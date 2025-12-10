import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../logic/bluetooth_hid_service.dart';
import '../logic/gesture_tracker.dart';
import '../logic/accelerometer_tracker.dart';
import 'flick_keyboard.dart';

enum TrackingMode { gesture, accelerometer }

class MouseSurface extends ConsumerStatefulWidget {
  const MouseSurface({super.key});

  @override
  ConsumerState<MouseSurface> createState() => _MouseSurfaceState();
}

class _MouseSurfaceState extends ConsumerState<MouseSurface> {
  TrackingMode _mode = TrackingMode.gesture;
  bool _isTracking = false;
  double _sensitivity = 2.0;
  
  final TextEditingController _ipController = TextEditingController();
  bool _showConnectionDialog = true;

  @override
  void initState() {
    super.initState();
    // Show connection dialog on start
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_showConnectionDialog) {
        _showConnectDialog();
      }
    });
  }

  void _showConnectDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Connect to PC'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter your PC\'s IP address:'),
            const SizedBox(height: 16),
            TextField(
              controller: _ipController,
              decoration: const InputDecoration(
                hintText: '192.168.1.100',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            const Text(
              'Make sure the Python server is running on your PC!',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final ip = _ipController.text.trim();
              if (ip.isNotEmpty) {
                final success = await ref.read(websocketServiceProvider).connect(ip);
                if (success && mounted) {
                  Navigator.of(context).pop();
                  _showConnectionDialog = false;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Connected to PC!')),
                  );
                } else if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Connection failed. Check IP and server.')),
                  );
                }
              }
            },
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }

  void _toggleTracking() {
    if (_mode == TrackingMode.accelerometer) {
      final tracker = ref.read(accelerometerTrackerProvider);
      if (_isTracking) {
        tracker.stopTracking();
      } else {
        tracker.setSensitivity(_sensitivity * 10);
        tracker.startTracking();
        // Listen to stream
        tracker.movementStream.listen((movement) {
          final dx = movement['dx']!.round();
          final dy = movement['dy']!.round();
          if (dx != 0 || dy != 0) {
            ref.read(websocketServiceProvider).sendMouseMove(dx, dy);
          }
        });
      }
    }
    setState(() {
      _isTracking = !_isTracking;
    });
  }

  void _switchMode() {
    if (_isTracking) {
      _toggleTracking(); // Stop current tracking
    }
    setState(() {
      _mode = _mode == TrackingMode.gesture 
          ? TrackingMode.accelerometer 
          : TrackingMode.gesture;
    });
  }

  @override
  Widget build(BuildContext context) {
    final gestureTracker = ref.read(gestureTrackerProvider);
    final wsService = ref.watch(websocketServiceProvider);
    gestureTracker.setSensitivity(_sensitivity);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.grey[900],
        title: Row(
          children: [
            Icon(
              wsService.isConnected ? Icons.wifi : Icons.wifi_off,
              color: wsService.isConnected ? Colors.green : Colors.red,
            ),
            const SizedBox(width: 8),
            Text(
              wsService.isConnected ? 'Connected' : 'Disconnected',
              style: const TextStyle(fontSize: 16),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showConnectDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Upper Half: Gesture Surface & Status
          Expanded(
            flex: 1,
            child: _mode == TrackingMode.gesture
                ? _buildGestureSurface(gestureTracker)
                : _buildAccelerometerSurface(),
          ),
          
          // Lower Half: Keyboard
          const Expanded(
            flex: 1,
            child: FlickKeyboard(),
          ),
        ],
      ),
    );
  }

  Widget _buildGestureSurface(GestureTracker tracker) {
    return GestureDetector(
      onTap: () {
        tracker.onTap();
        ref.read(websocketServiceProvider).sendMouseClick('left');
      },
      onLongPress: () {
        tracker.onLongPress();
        ref.read(websocketServiceProvider).sendMouseClick('right');
      },
      onDoubleTap: () {
        tracker.onDoubleTap();
        ref.read(websocketServiceProvider).sendMouseClick('left', action: 'double');
      },
      onPanStart: (details) {
        tracker.onPanStart(details);
      },
      onPanUpdate: (details) {
        tracker.onPanUpdate(details);
        // Get movement from tracker's stream
        tracker.movementStream.listen((movement) {
          final dx = movement['dx']!.round();
          final dy = movement['dy']!.round();
          if (dx != 0 || dy != 0) {
            ref.read(websocketServiceProvider).sendMouseMove(dx, dy);
          }
        });
      },
      onPanEnd: (details) {
        tracker.onPanEnd(details);
      },
      child: _buildSurfaceContent(
        'Gesture Mode',
        'Drag to move, Tap to click, Long press for right click',
        Icons.touch_app,
      ),
    );
  }

  Widget _buildAccelerometerSurface() {
    return _buildSurfaceContent(
      _isTracking ? 'Accelerometer Active' : 'Accelerometer Paused',
      'Tilt phone to move cursor',
      _isTracking ? Icons.sensors : Icons.sensors_outlined,
      showToggle: true,
    );
  }

  Widget _buildSurfaceContent(String title, String subtitle, IconData icon, {bool showToggle = false}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.grey[900]!, Colors.grey[850]!],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: _mode == TrackingMode.accelerometer && _isTracking 
                ? Colors.blue 
                : Colors.grey,
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(color: Colors.grey[400], fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          if (showToggle)
            ElevatedButton(
              onPressed: _toggleTracking,
              child: Text(_isTracking ? "Stop Tracking" : "Start Tracking"),
            ),
          const SizedBox(height: 10),
          ElevatedButton.icon(
            onPressed: _switchMode,
            icon: Icon(_mode == TrackingMode.gesture ? Icons.sensors : Icons.touch_app),
            label: Text('Switch to ${_mode == TrackingMode.gesture ? "Accelerometer" : "Gesture"}'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              children: [
                Text('Sensitivity: ${_sensitivity.toStringAsFixed(1)}', 
                  style: const TextStyle(color: Colors.white)),
                Slider(
                  value: _sensitivity,
                  min: 0.5,
                  max: 5.0,
                  divisions: 9,
                  onChanged: (value) {
                    setState(() {
                      _sensitivity = value;
                    });
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
