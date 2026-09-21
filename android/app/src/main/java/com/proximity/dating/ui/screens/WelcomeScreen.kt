package com.proximity.dating.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.proximity.dating.ui.components.BrandMark
import com.proximity.dating.ui.theme.AccentPink
import com.proximity.dating.ui.theme.Ink

@Composable
fun WelcomeScreen(
    onLogin: () -> Unit,
    onRegister: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A1222), Ink)))
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        BrandMark(size = 120.dp)
        Spacer(Modifier.height(28.dp))
        Text(
            text = "Proximity",
            color = Color.White,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Find your match nearby.\nReal people, real connections.",
            color = Color(0xFFAAA0C2),
            fontSize = 16.sp,
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(56.dp))
        Button(
            onClick = onLogin,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = AccentPink,
            ),
        ) {
            Text("Log in", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
            OutlinedButton(
                onClick = onRegister,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Text("Create account", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }
        }
        Spacer(Modifier.height(24.dp))
        Text(
            text = "18+. By continuing you agree to our Terms & Privacy Policy.",
            color = Color(0xFF7A7090),
            fontSize = 12.sp,
        )
    }
}