package com.bruiselea.zenbattle

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.bruiselea.zenbattle.ui.GameScreen
import com.bruiselea.zenbattle.ui.MenuScreen
import com.bruiselea.zenbattle.ui.SelectScreen
import com.bruiselea.zenbattle.ui.theme.ZenBattleTheme

class MainActivity : ComponentActivity() {
    private val viewModel: SensorViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ZenBattleTheme {
                // Navigation Setup
                val navController = rememberNavController()
                
                NavHost(navController = navController, startDestination = "menu") {
                    composable("menu") {
                        MenuScreen(
                            onNavigateToSelect = { navController.navigate("select") },
                            onNavigateToHistory = { /* TODO */ }
                        )
                    }
                    composable("select") {
                        SelectScreen(
                            onStartGame = { duration, difficulty ->
                                // Pass params to ViewModel before navigating
                                viewModel.setGameParams(duration, difficulty) 
                                navController.navigate("game")
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }
                    composable("game") {
                        GameScreen(
                            viewModel = viewModel,
                            onExit = { 
                                viewModel.stopGame()
                                navController.navigate("menu") {
                                    popUpTo("menu") { inclusive = true }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}


