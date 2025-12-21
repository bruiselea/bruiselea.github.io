import 'package:flutter/material.dart';

class FlickKeyboard extends StatelessWidget {
  const FlickKeyboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(8.0),
      child: Column(
        children: [
          // Row 1: A, Ka, Sa
          Expanded(
            child: Row(
              children: [
                _buildKey('あ'),
                _buildKey('か'),
                _buildKey('さ'),
              ],
            ),
          ),
          // Row 2: Ta, Na, Ha
          Expanded(
            child: Row(
              children: [
                _buildKey('た'),
                _buildKey('な'),
                _buildKey('は'),
              ],
            ),
          ),
          // Row 3: Ma, Ya, Ra
          Expanded(
            child: Row(
              children: [
                _buildKey('ま'),
                _buildKey('や'),
                _buildKey('ら'),
              ],
            ),
          ),
          // Row 4: Wa, ., Space/Enter
          Expanded(
            child: Row(
              children: [
                _buildKey('わ'), // Wa
                _buildKey('、'), // Punctuation
                _buildKey('Space'), // Special
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKey(String label) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: FlickKey(label: label),
      ),
    );
  }
}

class FlickKey extends StatefulWidget {
  final String label;
  const FlickKey({super.key, required this.label});

  @override
  State<FlickKey> createState() => _FlickKeyState();
}

class _FlickKeyState extends State<FlickKey> {
  String? _displayText;
  
  // Mapping for each column base char
  static const Map<String, List<String>> _flickMap = {
    'あ': ['あ', 'い', 'う', 'え', 'お'],
    'か': ['か', 'き', 'く', 'け', 'こ'],
    'さ': ['さ', 'し', 'す', 'せ', 'そ'],
    'た': ['た', 'ち', 'つ', 'て', 'と'],
    'な': ['な', 'に', 'ぬ', 'ね', 'の'],
    'は': ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    'ま': ['ま', 'み', 'む', 'め', 'も'],
    'や': ['や', '（', 'ゆ', '）', 'よ'], // Ya is special
    'ら': ['ら', 'り', 'る', 'れ', 'ろ'],
    'わ': ['わ', 'を', 'ん', 'ー', '〜'], // Wa is special
    '、': ['、', '。', '？', '！', '...'],
    'Space': [' ', 'Enter', 'BS', 'Tab', 'Esc'], // Special key
  };

  @override
  void initState() {
    super.initState();
    _displayText = widget.label;
  }

  void _handleFlick(Offset offset) {
    final chars = _flickMap[widget.label];
    if (chars == null) return;

    String selected = chars[0]; // Default center
    
    if (offset.distance > 20) { // Threshold
      final angle = offset.direction; // -pi to pi
      // Right: 0, Down: pi/2, Left: pi/-pi, Up: -pi/2
      
      if (angle > -0.78 && angle < 0.78) {
        // Right -> E
        selected = chars[3];
      } else if (angle >= 0.78 && angle < 2.35) {
        // Down -> O
        selected = chars[4];
      } else if (angle <= -0.78 && angle > -2.35) {
        // Up -> U
        selected = chars[2];
      } else {
        // Left -> I
        selected = chars[1];
      }
    }
    
    print("Flick Input: $selected");
    // TODO: Send to Bluetooth HID
    // We need to map 'selected' (Kana) to Romaji keystrokes.
    // e.g. 'か' -> 'k', 'a'
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanEnd: (details) {
        _handleFlick(details.velocity.pixelsPerSecond); // Use velocity as direction proxy? 
        // Actually velocity is speed. We need drag distance.
        // Better to use onPanUpdate to track offset from center.
      },
      // Let's use a simpler approach: onPanUpdate to visualize, onPanEnd to commit.
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[800],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[700]!),
        ),
        alignment: Alignment.center,
        child: Text(
          widget.label,
          style: const TextStyle(color: Colors.white, fontSize: 24),
        ),
      ),
    );
  }
}
