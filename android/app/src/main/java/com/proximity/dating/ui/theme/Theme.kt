package com.proximity.dating.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Brand palette (mirrors the web app: dark plum background, hot pink accent).
val Ink = Color(0xFF171023)
val SurfaceRaised = Color(0xFF221A36)
val AccentPink = Color(0xFFFF3B6B)
val LikeGreen = Color(0xFF2ECC71)
val NopeRed = Color(0xFFEF5350)
val SuperBlue = Color(0xFF4FC3F7)

private val DarkColors = darkColorScheme(
    primary = AccentPink,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF4A1F33),
    onPrimaryContainer = Color(0xFFFFD9E1),
    secondary = SuperBlue,
    onSecondary = Color(0xFF03212B),
    background = Ink,
    onBackground = Color(0xFFF4EFFF),
    surface = SurfaceRaised,
    onSurface = Color(0xFFF4EFFF),
    surfaceVariant = Color(0xFF2B2140),
    onSurfaceVariant = Color(0xFFC9BEDB),
    outline = Color(0xFF57496F),
    error = NopeRed,
)

@Composable
fun ProximityDatingTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        content = content,
    )
}