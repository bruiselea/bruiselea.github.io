package com.example.panicwallpaper.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val deadline: Long? = null, // Timestamp in milliseconds
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
