#!/usr/bin/env python3
"""
Phone as Mouse - PC Receiver Server

This server receives mouse and keyboard events from the Flutter app
and controls the PC's mouse and keyboard.

Requirements:
    pip install websockets pyautogui

Usage:
    python3 pc_receiver.py
    
Then connect from the Flutter app using ws://<YOUR_PC_IP>:8765
"""

import asyncio
import json
import websockets
import pyautogui
from datetime import datetime

# Configure PyAutoGUI
pyautogui.FAILSAFE = True  # Move mouse to corner to abort
pyautogui.PAUSE = 0.01  # Small pause between actions

class MouseServer:
    def __init__(self, host='0.0.0.0', port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        
    async def handle_client(self, websocket, path):
        """Handle incoming WebSocket connections"""
        client_addr = websocket.remote_address
        print(f"[{self._timestamp()}] Client connected: {client_addr}")
        self.clients.add(websocket)
        
        try:
            async for message in websocket:
                await self.process_message(message, websocket)
        except websockets.exceptions.ConnectionClosed:
            print(f"[{self._timestamp()}] Client disconnected: {client_addr}")
        finally:
            self.clients.remove(websocket)
    
    async def process_message(self, message, websocket):
        """Process incoming messages from the Flutter app"""
        try:
            data = json.loads(message)
            event_type = data.get('type')
            
            if event_type == 'mouse_move':
                dx = data.get('dx', 0)
                dy = data.get('dy', 0)
                self.move_mouse(dx, dy)
                
            elif event_type == 'mouse_click':
                button = data.get('button', 'left')  # 'left', 'right', 'middle'
                action = data.get('action', 'click')  # 'click', 'down', 'up', 'double'
                self.click_mouse(button, action)
                
            elif event_type == 'scroll':
                amount = data.get('amount', 0)
                self.scroll(amount)
                
            elif event_type == 'key_press':
                key = data.get('key')
                self.press_key(key)
                
            elif event_type == 'ping':
                # Respond to ping for connection check
                print(f"[{self._timestamp()}] Received ping, sending pong")
                # Send pong response
                await websocket.send(json.dumps({'type': 'pong'}))
            
        except json.JSONDecodeError:
            print(f"[{self._timestamp()}] Invalid JSON received: {message}")
        except Exception as e:
            print(f"[{self._timestamp()}] Error processing message: {e}")
    
    def move_mouse(self, dx, dy):
        """Move mouse by relative amount"""
        current_x, current_y = pyautogui.position()
        new_x = current_x + int(dx)
        new_y = current_y + int(dy)
        pyautogui.moveTo(new_x, new_y)
    
    def click_mouse(self, button='left', action='click'):
        """Perform mouse click"""
        if action == 'click':
            pyautogui.click(button=button)
        elif action == 'down':
            pyautogui.mouseDown(button=button)
        elif action == 'up':
            pyautogui.mouseUp(button=button)
        elif action == 'double':
            pyautogui.doubleClick(button=button)
    
    def scroll(self, amount):
        """Scroll mouse wheel"""
        pyautogui.scroll(int(amount))
    
    def press_key(self, key):
        """Press a keyboard key"""
        if key:
            pyautogui.press(key)
    
    def _timestamp(self):
        """Get current timestamp"""
        return datetime.now().strftime("%H:%M:%S")
    
    async def start(self):
        """Start the WebSocket server"""
        print("=" * 50)
        print("Phone as Mouse - PC Receiver Server")
        print("=" * 50)
        print(f"Starting server on {self.host}:{self.port}")
        print(f"\nConnect from your phone using:")
        print(f"  ws://<YOUR_PC_IP>:{self.port}")
        print(f"\nTo find your PC's IP address:")
        print(f"  - macOS: System Settings > Network")
        print(f"  - Windows: ipconfig")
        print(f"  - Linux: ip addr")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 50)
        
        async with websockets.serve(self.handle_client, self.host, self.port):
            await asyncio.Future()  # Run forever

def main():
    server = MouseServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")

if __name__ == "__main__":
    main()
