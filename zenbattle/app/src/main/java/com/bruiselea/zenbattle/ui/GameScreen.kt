package com.bruiselea.zenbattle.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bruiselea.zenbattle.SensorViewModel

@Composable
fun GameScreen(
    viewModel: SensorViewModel,
    onExit: () -> Unit
) {
    val gameState by viewModel.gameState.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color.White // Zen White
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // Score Display (Top)
            Column(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (gameState.isPlaying) "${gameState.currentScore.toInt()}" else "MEDITATE",
                    color = Color.Black,
                    fontSize = 48.sp,
                    fontFamily = FontFamily.Serif,
                    letterSpacing = 4.sp
                )
                if (!gameState.isPlaying && gameState.bestScore > 0f) {
                    Text(
                        text = "BEST: ${gameState.bestScore.toInt()}",
                        color = Color.Gray,
                        fontSize = 16.sp,
                        fontFamily = FontFamily.Serif,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
                
                // Multiplier Display (Only when playing)
                if (gameState.isPlaying) {
                    Text(
                        text = "x${String.format("%.1f", gameState.multiplier)}",
                        color = if (gameState.multiplier >= 5.0f) Color.Magenta else Color.LightGray,
                        fontSize = 24.sp,
                        fontFamily = FontFamily.Serif,
                        modifier = Modifier.padding(top = 16.dp)
                    )
                    // Angle Feedback (Debug/Feedback)
                    Text(
                        text = "ブレ (Deviation): ${String.format("%.1f", gameState.angleDeviation)}°",
                        color = if (gameState.angleDeviation < 1.0f) Color.Gray else Color.Red,
                        fontSize = 14.sp,
                        fontFamily = FontFamily.Serif,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    
                    if (gameState.multiplier >= 5.0f) {
                         Text(
                            text = "NIRVANA",
                            color = Color.Magenta,
                            fontSize = 14.sp,
                            fontFamily = FontFamily.Serif
                        )
                    }
                }
            }
            
            // Timer Display (Top Right)
            if (gameState.timeLeftMs >= 0) {
                 Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.TopEnd
                ) {
                    val totalSeconds = gameState.timeLeftMs / 1000
                    val minutes = totalSeconds / 60
                    val seconds = totalSeconds % 60
                    Text(
                        text = String.format("%02d:%02d", minutes, seconds),
                        color = Color.Gray,
                        fontSize = 20.sp,
                        fontFamily = FontFamily.Serif
                    )
                }
            }

            // The Horizon Line
            // It rotates slightly based on angleDeviation to show instability
            // It fades if stability is low
            val rotation by animateFloatAsState(targetValue = gameState.angleDeviation * 2f) // Amplify slightly
            val alpha by animateFloatAsState(targetValue = if (gameState.stability > 0.5) 1f else 0.3f)

            Canvas(
                modifier = Modifier
                    .fillMaxWidth(0.8f) // 80% width
                    .height(2.dp) // Thin line
                    .graphicsLayer {
                        rotationZ = rotation
                        this.alpha = alpha
                    }
            ) {
                drawLine(
                    color = Color.Black,
                    start = Offset(0f, size.height / 2),
                    end = Offset(size.width, size.height / 2),
                    strokeWidth = 4f
                )
            }

            // Start/Stop Logic
            Column(
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 64.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                 Button(
                    onClick = {
                        if (gameState.isPlaying) viewModel.stopGame() else viewModel.startGame()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Black,
                        contentColor = Color.White
                    )
                ) {
                    Text(
                        text = if (gameState.isPlaying) "STOP" else "START",
                        fontFamily = FontFamily.Serif,
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "退出",
                    fontFamily = FontFamily.Serif,
                    color = Color.Gray,
                    modifier = Modifier.clickable { onExit() }.padding(8.dp)
                )
            }
        }
    }
}
