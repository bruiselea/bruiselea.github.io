
package com.bruiselea.zenbattle

import android.app.Application
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.sqrt

data class GameState(
    val isPlaying: Boolean = false,
    val currentScore: Float = 0f, // Changed to Float for micro-accumulation
    val bestScore: Float = 0f, // Changed to Float
    val stability: Float = 1.0f, // 1.0 = perfect, 0.0 = fell
    val angleDeviation: Float = 0f, // Degrees from initial
    val multiplier: Float = 1.0f, // Zen Flow Multiplier
    val comboTimeSec: Float = 0f, // Time spent in perfect stillness
    val timeLeftMs: Long = 0 // Remaining time in Milliseconds
)

class SensorViewModel(application: Application) : AndroidViewModel(application), SensorEventListener {

    private val sensorManager = application.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val gravitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY)

    private val _gameState = MutableStateFlow(GameState())
    val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private var initialGravity: FloatArray? = null
    private var lastTimestamp: Long = 0

    // Thresholds
    private var allowedDeviationDeg = 1.0f 
    private var gameDurationMinutes = 1
    
    fun setGameParams(duration: Int, difficulty: String) {
        gameDurationMinutes = duration
        allowedDeviationDeg = when(difficulty) {
            "Easy" -> 10.0f  // Was 2.0f
            "Hard" -> 2.0f   // Was 0.5f
            else -> 5.0f     // Normal (Was 1.0f)
        }
    }

    fun startGame() {
        initialGravity = null
        lastTimestamp = System.currentTimeMillis()
        val initialTimeLeft = if (gameDurationMinutes > 0) gameDurationMinutes * 60 * 1000L else -1L // ms
        
        _gameState.update { 
            it.copy(

                isPlaying = true, 
                currentScore = 0f, 
                stability = 1.0f, 
                angleDeviation = 0f,
                multiplier = 1.0f,
                comboTimeSec = 0f,
                timeLeftMs = initialTimeLeft
            ) 
        }
        sensorManager.registerListener(this, gravitySensor, SensorManager.SENSOR_DELAY_GAME)
    }

    fun stopGame() {
        sensorManager.unregisterListener(this)
        _gameState.update { it.copy(isPlaying = false) }
        // TODO: Save best score here
        val current = _gameState.value.currentScore
        if (current > _gameState.value.bestScore) {
             _gameState.update { it.copy(bestScore = current) }
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return
        if (!_gameState.value.isPlaying) return

        if (event.sensor.type == Sensor.TYPE_GRAVITY) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]

            if (initialGravity == null) {
                initialGravity = floatArrayOf(x, y, z)
                return
            }

            // Calculate angle deviation
            val dot = x * initialGravity!![0] + y * initialGravity!![1] + z * initialGravity!![2]
            val magCurr = sqrt(x*x + y*y + z*z)
            val magInit = sqrt(initialGravity!![0]*initialGravity!![0] + initialGravity!![1]*initialGravity!![1] + initialGravity!![2]*initialGravity!![2])
            
            // Avoid division by zero
            if (magCurr == 0f || magInit == 0f) return

            var cosine = dot / (magCurr * magInit)
            // Clamp cosine to -1..1 to avoid NaN from float errors
            if (cosine > 1.0f) cosine = 1.0f
            if (cosine < -1.0f) cosine = -1.0f

            val angleRad = acos(cosine)
            val angleDeg = Math.toDegrees(angleRad.toDouble()).toFloat()

            _gameState.update { it.copy(angleDeviation = angleDeg) }

            // Scoring Logic
            val currentTime = System.currentTimeMillis()
            val dt = currentTime - lastTimestamp
            if (dt > 100) { // Update frequency
                val dtSec = dt / 1000f
                val currentTimeLeftMs = _gameState.value.timeLeftMs
                
                // Decrement Timer strictly by dt
                val nextTimeLeftMs = if (currentTimeLeftMs > 0) {
                     Math.max(0, currentTimeLeftMs - dt)
                } else currentTimeLeftMs

                if (angleDeg < allowedDeviationDeg) {
                    // Good Zazen (Stable)
                    var newComboTime = _gameState.value.comboTimeSec + dtSec
                    
                    // Simple Deterministic Multiplier: +0.1x every 5 seconds
                    // Base 1.0. 
                    // 0-5s: 1.0
                    // 5-10s: 1.1
                    val bonusSteps = (newComboTime / 5.0f).toInt()
                    var newMultiplier = 1.0f + (bonusSteps * 0.1f)
                    if (newMultiplier > 5.0f) newMultiplier = 5.0f

                    // Score Calculation (Deflated Model to aim for ~100pts total)
                    // Tick rate: ~10Hz (100ms)
                    // Target: ~1.5 points / sec at Max Performance.
                    
                    // 1. Precision Score
                    // Max: 0.02 per tick (0.2/sec) if angle < 0.1
                    val safeAngle = if (angleDeg < 0.1f) 0.1f else angleDeg
                    val precisionPoints = (0.002f / safeAngle) 
                    
                    // 2. Survival Score
                    // Fixed: 0.01 per tick (0.1/sec)
                    val survivalPoints = 0.01f
                    
                    // Total Points
                    val totalTickPoints = (precisionPoints + survivalPoints) * newMultiplier

                    _gameState.update { 
                        it.copy(
                            currentScore = it.currentScore + totalTickPoints,
                            stability = 1.0f,
                            multiplier = newMultiplier,
                            comboTimeSec = newComboTime,
                            timeLeftMs = nextTimeLeftMs
                        ) 
                    }
                } else {
                    // Disturbed (Penalty)
                    _gameState.update { 
                        it.copy(
                            stability = 0.0f,
                            multiplier = 1.0f, 
                            comboTimeSec = 0f,
                            timeLeftMs = nextTimeLeftMs
                        ) 
                    }
                }
                

                
                // End Game Check
                // Correct implementation needs precise start time, but this 'dt deduction' is okay for short sessions
                // Fixing the weird timeLeft logic: 
                // Creating a proper countdown requires a start timestamp member. 
                // I will add `private var gameStartTime: Long = 0` to the class in a separate edit if needed, 
                // but for now let's just use `lastTimestamp` for dt.
                
                // Check if time is up
                 if (_gameState.value.timeLeftMs == 0L && _gameState.value.timeLeftMs != -1L) {
                     stopGame()
                 }
                 
                lastTimestamp = currentTime
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }

    override fun onCleared() {
        super.onCleared()
        sensorManager.unregisterListener(this)
    }
}
