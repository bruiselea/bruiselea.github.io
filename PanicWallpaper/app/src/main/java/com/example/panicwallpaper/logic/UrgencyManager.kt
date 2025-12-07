package com.example.panicwallpaper.logic

import android.graphics.Color
import com.example.panicwallpaper.data.Task
import java.util.concurrent.TimeUnit
import kotlin.math.min

object UrgencyManager {

    private const val COLOR_SAFE = 0xFF4CAF50.toInt() // Green
    private const val COLOR_WARNING = 0xFFFFC107.toInt() // Amber
    private const val COLOR_DANGER = 0xFFF44336.toInt() // Red
    
    // Panic level 0.0 (Safe) to 1.0 (Panic)
    fun calculatePanicLevel(tasks: List<Task>): Float {
        if (tasks.isEmpty()) return 0f

        var panicPoints = 0.0f
        val now = System.currentTimeMillis()
        val oneDayMillis = TimeUnit.DAYS.toMillis(1)

        val activeTasks = tasks.filter { !it.isCompleted }
        
        // base pressure for having tasks at all
        panicPoints += activeTasks.size * 0.05f

        activeTasks.forEach { task ->
            task.deadline?.let { deadline ->
                val timeRemaining = deadline - now
                
                if (timeRemaining < 0) {
                    // Overdue! Immediate high stress.
                    panicPoints += 0.4f
                } else if (timeRemaining < oneDayMillis) {
                    // Due within 24h
                    panicPoints += 0.2f
                } else if (timeRemaining < oneDayMillis * 3) {
                    // Due within 3 days
                    panicPoints += 0.1f
                }
            }
        }

        // Cap at 1.0
        return min(panicPoints, 1.0f)
    }

    fun getPanicColor(panicLevel: Float): Int {
        // Multi-stage interpolation: Green -> Yellow -> Red
        return if (panicLevel < 0.5f) {
            // 0.0 - 0.5 : Green to Amber
            val localFraction = panicLevel / 0.5f
            interpolateColor(COLOR_SAFE, COLOR_WARNING, localFraction)
        } else {
            // 0.5 - 1.0 : Amber to Red
            val localFraction = (panicLevel - 0.5f) / 0.5f
            interpolateColor(COLOR_WARNING, COLOR_DANGER, localFraction)
        }
    }

    private fun interpolateColor(startColor: Int, endColor: Int, fraction: Float): Int {
        val startA = Color.alpha(startColor)
        val startR = Color.red(startColor)
        val startG = Color.green(startColor)
        val startB = Color.blue(startColor)

        val endA = Color.alpha(endColor)
        val endR = Color.red(endColor)
        val endG = Color.green(endColor)
        val endB = Color.blue(endColor)

        val a = (startA + (fraction * (endA - startA))).toInt()
        val r = (startR + (fraction * (endR - startR))).toInt()
        val g = (startG + (fraction * (endG - startG))).toInt()
        val b = (startB + (fraction * (endB - startB))).toInt()

        return Color.argb(a, r, g, b)
    }
}
