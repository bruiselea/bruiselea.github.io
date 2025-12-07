package com.example.panicwallpaper

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import com.example.panicwallpaper.data.Task
import com.example.panicwallpaper.data.TaskDatabase
import com.example.panicwallpaper.logic.UrgencyManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class TaskWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine {
        return TaskEngine()
    }

    inner class TaskEngine : Engine() {
        private val scope = CoroutineScope(Dispatchers.Main + Job())
        private var tasks: List<Task> = emptyList()
        private var panicLevel: Float = 0f

        // Paints
        private val textPaint = Paint().apply {
            color = Color.WHITE
            textSize = 60f
            isAntiAlias = true
            style = Paint.Style.FILL
            textAlign = Paint.Align.LEFT
        }

        private var hitBoxes: MutableList<Pair<android.graphics.RectF, Task>> = mutableListOf()

        override fun onCreate(surfaceHolder: SurfaceHolder?) {
            super.onCreate(surfaceHolder)
            setTouchEventsEnabled(true)
            // Start observing data
            observeTasks()
        }

        private fun observeTasks() {
            val dao = TaskDatabase.getDatabase(applicationContext).taskDao()
            scope.launch {
                dao.getAllActiveTasks().collectLatest { newTasks ->
                    tasks = newTasks
                    panicLevel = UrgencyManager.calculatePanicLevel(newTasks)
                    if (isVisible) {
                        draw()
                    }
                }
            }
        }

        override fun onTouchEvent(event: android.view.MotionEvent?) {
            super.onTouchEvent(event)
            if (event?.action == android.view.MotionEvent.ACTION_UP) {
                val x = event.x
                val y = event.y
                
                // Check hits
                hitBoxes.firstOrNull { it.first.contains(x, y) }?.let { (_, task) ->
                    // Hit! Complete the task
                    scope.launch(Dispatchers.IO) {
                        val dao = TaskDatabase.getDatabase(applicationContext).taskDao()
                        dao.update(task.copy(isCompleted = true))
                    }
                }
            }
        }

        override fun onVisibilityChanged(visible: Boolean) {
            if (visible) {
                draw()
            }
        }

        override fun onSurfaceChanged(holder: SurfaceHolder?, format: Int, width: Int, height: Int) {
            super.onSurfaceChanged(holder, format, width, height)
            if (isVisible) {
                draw()
            }
        }

        override fun onDestroy() {
            super.onDestroy()
            scope.cancel()
        }

        private fun draw() {
            val holder = surfaceHolder
            var canvas: Canvas? = null
            try {
                canvas = holder.lockCanvas()
                if (canvas != null) {
                    drawContent(canvas)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                if (canvas != null) {
                    try {
                        holder.unlockCanvasAndPost(canvas)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }

        private fun drawContent(canvas: Canvas) {
            hitBoxes.clear()
            
            // 1. Draw Background (Urgency Color)
            val bgColor = UrgencyManager.getPanicColor(panicLevel)
            canvas.drawColor(bgColor)

            // 2. Draw Tasks
            val width = canvas.width
            val height = canvas.height
            
            // Simple positioning logic
            var yPos = 200f
            val xPos = 100f
            val lineHeight = 80f

            textPaint.color = Color.WHITE
            // Shadow for better visibility
            textPaint.setShadowLayer(5f, 2f, 2f, Color.BLACK)

            // Header
            textPaint.textSize = 80f
            textPaint.isFakeBoldText = true
            canvas.drawText("Pending Tasks: ${tasks.size}", xPos, yPos, textPaint)
            
            yPos += 120f
            textPaint.textSize = 60f
            textPaint.isFakeBoldText = false
            
            tasks.take(10).forEach { task ->
                // Apply Dynamic Font
                textPaint.typeface = UrgencyManager.getTypefaceForTask(task)

                // Truncate if too long
                val text = if (task.title.length > 20) task.title.take(20) + "..." else task.title
                
                // Date formatting for Wallpaper
                val daysLeft = task.deadline?.let {
                    val diff = it - System.currentTimeMillis()
                    java.util.concurrent.TimeUnit.MILLISECONDS.toDays(diff)
                }
                
                val dateText = when {
                    daysLeft == null -> ""
                    daysLeft < 0 -> "(!!)"
                    daysLeft == 0L -> "(Today)"
                    else -> "(${daysLeft}d)"
                }
                
                val fullText = "• $text $dateText"
                canvas.drawText(fullText, xPos, yPos, textPaint)
                
                // Calculate HitBox
                val textWidth = textPaint.measureText(fullText)
                val rect = android.graphics.RectF(xPos, yPos - 60f, xPos + textWidth, yPos + 20f) // approx height
                hitBoxes.add(Pair(rect, task))
                
                yPos += lineHeight
            }

            if (tasks.size > 10) {
                 canvas.drawText("... and ${tasks.size - 10} more", xPos, yPos + 20, textPaint)
            }
        }
    }
}
