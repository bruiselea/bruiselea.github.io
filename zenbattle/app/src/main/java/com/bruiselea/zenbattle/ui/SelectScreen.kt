package com.bruiselea.zenbattle.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SelectScreen(
    onStartGame: (durationMinutes: Int, difficulty: String) -> Unit,
    onBack: () -> Unit
) {
    var selectedDuration by remember { mutableStateOf(1) } // Default 1 min
    var selectedDifficulty by remember { mutableStateOf("Normal") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween // Spread out header, content, footer
    ) {
        // Header
        Text(
            text = "心構え",
            fontSize = 32.sp,
            fontFamily = FontFamily.Serif,
            modifier = Modifier.padding(top = 48.dp)
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.weight(1f)
        ) {
            // Duration Section
            SectionHeader("時間")
            Row(horizontalArrangement = Arrangement.Center) {
                SelectOption("一分", selected = selectedDuration == 1) { selectedDuration = 1 }
                Spacer(modifier = Modifier.width(16.dp))
                SelectOption("五分", selected = selectedDuration == 5) { selectedDuration = 5 }
                Spacer(modifier = Modifier.width(16.dp))
                SelectOption("無限", selected = selectedDuration == -1) { selectedDuration = -1 }
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Difficulty Section
            SectionHeader("難易度")
            Row(horizontalArrangement = Arrangement.Center) {
                SelectOption("見習い", selected = selectedDifficulty == "Easy") { selectedDifficulty = "Easy" }
                Spacer(modifier = Modifier.width(16.dp))
                SelectOption("住職", selected = selectedDifficulty == "Normal") { selectedDifficulty = "Normal" }
                Spacer(modifier = Modifier.width(16.dp))
                SelectOption("大仏", selected = selectedDifficulty == "Hard") { selectedDifficulty = "Hard" }
            }
        }

        // Footer Actions
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Button(
                onClick = { onStartGame(selectedDuration, selectedDifficulty) },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Text("座禅開始", fontFamily = FontFamily.Serif, fontSize = 20.sp, modifier = Modifier.padding(8.dp))
            }
            Text(
                text = "戻る",
                fontFamily = FontFamily.Serif,
                color = Color.Gray,
                modifier = Modifier.clickable { onBack() }.padding(8.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun SectionHeader(text: String) {
    Text(
        text = text,
        fontSize = 18.sp,
        fontFamily = FontFamily.Serif,
        color = Color.Gray,
        modifier = Modifier.padding(bottom = 16.dp)
    )
}

@Composable
fun SelectOption(text: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .border(width = 1.dp, color = if (selected) Color.Black else Color.Transparent, shape = CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = text,
            fontFamily = FontFamily.Serif,
            fontSize = 18.sp,
            color = if (selected) Color.Black else Color.Gray
        )
    }
}
