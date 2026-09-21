package com.proximity.dating.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.proximity.dating.ui.auth.AuthUiState
import com.proximity.dating.ui.auth.AuthViewModel
import com.proximity.dating.ui.components.BrandMark
import com.proximity.dating.ui.theme.AccentPink
import com.proximity.dating.ui.theme.Ink

@Composable
fun SplashScreen(
    viewModel: AuthViewModel,
    onFinished: (Boolean) -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state) {
        val ready = state as? AuthUiState.Ready ?: return@LaunchedEffect
        onFinished(ready.isLoggedIn)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(Color(0xFF1A1222), Ink))
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            BrandMark(size = 96.dp)
            androidx.compose.foundation.layout.Spacer(Modifier.size(20.dp))
            Text(
                text = "Proximity",
                color = Color.White,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Find your match nearby",
                color = Color(0xFFAAA0C2),
                fontSize = 15.sp,
            )
            androidx.compose.foundation.layout.Spacer(Modifier.size(40.dp))
            CircularProgressIndicator(color = AccentPink)
        }
    }
}