import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

final websocketServiceProvider = Provider((ref) => WebSocketService());

class WebSocketService {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  String? _serverUrl;
  
  final _connectionController = StreamController<bool>.broadcast();
  Stream<bool> get connectionStream => _connectionController.stream;
  
  bool get isConnected => _isConnected;
  String? get serverUrl => _serverUrl;

  Future<bool> connect(String host, {int port = 8765}) async {
    try {
      _serverUrl = 'ws://$host:$port';
      print('Attempting to connect to $_serverUrl');
      
      _channel = WebSocketChannel.connect(Uri.parse(_serverUrl!));
      
      // Create a completer to wait for first message or error
      final completer = Completer<bool>();
      bool completed = false;
      
      // Listen for connection events
      final subscription = _channel!.stream.listen(
        (message) {
          print('Received message from server: $message');
          if (!completed) {
            completed = true;
            completer.complete(true);
          }
        },
        onDone: () {
          print('WebSocket connection closed');
          _isConnected = false;
          _connectionController.add(false);
          if (!completed) {
            completed = true;
            completer.complete(false);
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isConnected = false;
          _connectionController.add(false);
          if (!completed) {
            completed = true;
            completer.complete(false);
          }
        },
      );
      
      // Send a ping to verify connection
      _channel!.sink.add(jsonEncode({'type': 'ping'}));
      
      // Wait for response or timeout
      final connected = await completer.future.timeout(
        const Duration(seconds: 3),
        onTimeout: () {
          print('Connection timeout');
          return false;
        },
      );
      
      if (connected) {
        _isConnected = true;
        _connectionController.add(true);
        print('Successfully connected to server');
        return true;
      } else {
        subscription.cancel();
        _channel?.sink.close();
        _channel = null;
        _isConnected = false;
        _connectionController.add(false);
        return false;
      }
    } catch (e) {
      print('Connection error: $e');
      _isConnected = false;
      _connectionController.add(false);
      return false;
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _isConnected = false;
    _connectionController.add(false);
  }

  void sendMouseMove(int dx, int dy) {
    if (!_isConnected) return;
    
    final message = jsonEncode({
      'type': 'mouse_move',
      'dx': dx,
      'dy': dy,
    });
    
    _channel?.sink.add(message);
  }

  void sendMouseClick(String button, {String action = 'click'}) {
    if (!_isConnected) return;
    
    final message = jsonEncode({
      'type': 'mouse_click',
      'button': button,
      'action': action,
    });
    
    _channel?.sink.add(message);
  }

  void sendScroll(int amount) {
    if (!_isConnected) return;
    
    final message = jsonEncode({
      'type': 'scroll',
      'amount': amount,
    });
    
    _channel?.sink.add(message);
  }

  void sendKeyPress(String key) {
    if (!_isConnected) return;
    
    final message = jsonEncode({
      'type': 'key_press',
      'key': key,
    });
    
    _channel?.sink.add(message);
  }

  void sendPing() {
    if (!_isConnected) return;
    
    final message = jsonEncode({
      'type': 'ping',
    });
    
    _channel?.sink.add(message);
  }

  void dispose() {
    disconnect();
    _connectionController.close();
  }
}
