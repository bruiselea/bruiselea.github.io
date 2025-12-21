package com.bruiselea.zenbattle.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

@Composable
fun ZenBattleTheme(content: @Composable () -> Unit) {
    // Basic Material 3 Theme wrapper
    MaterialTheme(
        content = content
    )
}
