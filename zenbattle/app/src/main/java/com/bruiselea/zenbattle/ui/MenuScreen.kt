package com.bruiselea.zenbattle.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MenuScreen(
    onNavigateToSelect: () -> Unit,
    onNavigateToHistory: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Title: Vertical Text "Zazen"
        Text(
            text = "座\n禅",
            fontSize = 96.sp,
            fontFamily = FontFamily.Serif,
            lineHeight = 100.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 64.dp)
        )

        // Menu Options
        MenuOption(text = "一人座禅", onClick = onNavigateToSelect)
        Spacer(modifier = Modifier.height(24.dp))
        MenuOption(text = "通信対戦", onClick = {}, enabled = false) // Disabled for now
        Spacer(modifier = Modifier.height(24.dp))
        MenuOption(text = "修行記録", onClick = onNavigateToHistory)
    }
}

@Composable
fun MenuOption(
    text: String,
    onClick: () -> Unit,
    enabled: Boolean = true
) {
    Text(
        text = text,
        fontSize = 24.sp,
        fontFamily = FontFamily.Serif,
        color = if (enabled) Color.Black else Color.LightGray,
        modifier = Modifier
            .clickable(enabled = enabled, onClick = onClick)
            .padding(8.dp)
    )
}
