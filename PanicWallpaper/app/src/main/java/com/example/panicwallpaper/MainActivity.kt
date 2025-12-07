package com.example.panicwallpaper

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.panicwallpaper.data.Task
import com.example.panicwallpaper.data.TaskDatabase
import com.example.panicwallpaper.databinding.ActivityMainBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import nl.dionsegijn.konfetti.core.Party
import nl.dionsegijn.konfetti.core.Position
import nl.dionsegijn.konfetti.core.emitter.Emitter
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var database: TaskDatabase
    private val adapter = TaskAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        database = TaskDatabase.getDatabase(this)

        setupRecyclerView()
        setupInput()
        observeTasks()
    }

    private fun setupRecyclerView() {
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private var selectedDeadline: Long = System.currentTimeMillis() + TimeUnit.DAYS.toMillis(1) // Default tomorrow

    private fun setupInput() {
        binding.btnSetWallpaper.setOnClickListener {
            try {
                val intent = android.content.Intent(android.app.WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
                intent.putExtra(android.app.WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, 
                    android.content.ComponentName(this, TaskWallpaperService::class.java))
                startActivity(intent)
            } catch (e: Exception) {
                // Fallback for devices that don't support direct shortcut
                val intent = android.content.Intent(android.app.WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER)
                startActivity(intent)
            }
        }

        binding.btnDate.setOnClickListener {
            val calendar = java.util.Calendar.getInstance()
            android.app.DatePickerDialog(this, { _, year, month, day ->
                val selected = java.util.Calendar.getInstance()
                selected.set(year, month, day, 23, 59, 59) // End of day
                selectedDeadline = selected.timeInMillis
                android.widget.Toast.makeText(this, "Deadline set", android.widget.Toast.LENGTH_SHORT).show()
                // Could update UI to show selected date icon change here
            }, calendar.get(java.util.Calendar.YEAR), calendar.get(java.util.Calendar.MONTH), calendar.get(java.util.Calendar.DAY_OF_MONTH)).show()
        }

        binding.btnAdd.setOnClickListener {
            val title = binding.etTaskTitle.text.toString().trim()
            if (title.isNotEmpty()) {
                lifecycleScope.launch {
                    val task = Task(title = title, deadline = selectedDeadline) 
                    database.taskDao().insert(task)
                    binding.etTaskTitle.text.clear()
                    // Reset to tomorrow
                    selectedDeadline = System.currentTimeMillis() + TimeUnit.DAYS.toMillis(1)
                }
            }
        }
    }

    private fun observeTasks() {
        lifecycleScope.launch {
            database.taskDao().getAllActiveTasks().collectLatest { tasks ->
                adapter.submitList(tasks)
            }
        }
    }

    private fun onTaskCompleted(task: Task) {
        // 1. Play Confetti
        explodeConfetti()
        
        // 2. Mark complete in DB (delayed slightly to let user see check)
        lifecycleScope.launch {
            val updatedTask = task.copy(isCompleted = true)
            database.taskDao().update(updatedTask)
        }
    }

    private fun explodeConfetti() {
        val party = Party(
            speed = 0f,
            maxSpeed = 30f,
            damping = 0.9f,
            spread = 360,
            colors = listOf(0xfce18a, 0xff726d, 0xf4306d, 0xb48def),
            position = Position.Relative(0.5, 0.3),
            emitter = Emitter(duration = 100, TimeUnit.MILLISECONDS).max(100)
        )
        binding.konfettiView.start(party)
    }

    // --- Adapter ---
    inner class TaskAdapter : RecyclerView.Adapter<TaskAdapter.TaskViewHolder>() {
        private var tasks: List<Task> = emptyList()

        fun submitList(newTasks: List<Task>) {
            tasks = newTasks
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TaskViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_task, parent, false)
            return TaskViewHolder(view)
        }

        override fun onBindViewHolder(holder: TaskViewHolder, position: Int) {
            holder.bind(tasks[position])
        }

        override fun getItemCount() = tasks.size

        inner class TaskViewHolder(itemView: android.view.View) : RecyclerView.ViewHolder(itemView) {
            private val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)
            private val tvDeadline: TextView = itemView.findViewById(R.id.tvDeadline)
            private val cbCompleted: CheckBox = itemView.findViewById(R.id.cbCompleted)

            fun bind(task: Task) {
                tvTitle.text = task.title
                cbCompleted.setOnCheckedChangeListener(null)
                cbCompleted.isChecked = task.isCompleted
                
                // Format deadline
                task.deadline?.let { deadline ->
                    val now = System.currentTimeMillis()
                    val diff = deadline - now
                    val days = TimeUnit.MILLISECONDS.toDays(diff)
                    
                    tvDeadline.text = when {
                        diff < 0 -> "Overdue!"
                        days == 0L -> "Today"
                        days == 1L -> "Tomorrow"
                        else -> "$days days left"
                    }
                    
                    if (diff < 0) {
                        tvDeadline.setTextColor(Color.RED)
                    } else {
                        tvDeadline.setTextColor(Color.GRAY)
                    }
                } ?: run {
                    tvDeadline.text = ""
                }
                
                cbCompleted.setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) {
                        onTaskCompleted(task)
                    }
                }
            }
        }
    }
}
