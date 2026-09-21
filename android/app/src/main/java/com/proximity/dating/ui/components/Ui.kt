package com.proximity.dating.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.proximity.dating.ui.theme.AccentPink
import com.proximity.dating.util.formatDistance
import com.proximity.dating.util.resolveImageUrl

/** Round avatar that falls back to the user's initial. */
@Composable
fun AsyncAvatar(
    url: String?,
    name: String?,
    modifier: Modifier = Modifier.size(48.dp),
) {
    val resolved = resolveImageUrl(url)
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center,
    ) {
        if (resolved != null) {
            AsyncImage(
                model = resolved,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            Text(
                text = name?.firstOrNull()?.uppercase() ?: "?",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.titleLarge,
            )
        }
    }
}

@Composable
fun VerifiedBadge(modifier: Modifier = Modifier) {
    Icon(
        imageVector = Icons.Filled.Verified,
        contentDescription = "Verified",
        tint = Color(0xFF4FC3F7),
        modifier = modifier.size(18.dp),
    )
}

@Composable
fun FullScreenLoading(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
fun ErrorState(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyLarge,
        )
        if (onRetry != null) {
            Spacer(Modifier.height(16.dp))
            Button(onClick = onRetry) { Text("Try again") }
        }
    }
}

@Composable
fun EmptyState(title: String, subtitle: String? = null, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
        if (subtitle != null) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** Row of header info (name + verified, location + distance) used on cards. */
@Composable
fun ProfileHeader(
    name: String,
    verified: Boolean,
    subtitle: String?,
    nameStyle: androidx.compose.ui.text.TextStyle = MaterialTheme.typography.headlineSmall,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(text = name, style = nameStyle, fontWeight = FontWeight.Bold)
        if (verified) {
            Spacer(Modifier.size(6.dp))
            VerifiedBadge()
        }
    }
    if (!subtitle.isNullOrBlank()) {
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun CompactDistance(miles: Double?) {
    val label = formatDistance(miles)
    if (label != null) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun SurfaceCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface),
    ) { content() }
}

/** The brand heart logo. */
@Composable
fun BrandMark(size: androidx.compose.ui.unit.Dp = 72.dp) {
    Box(
        modifier = Modifier.size(size),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val c = size.toPx() / 2f
            val heartPath = androidx.compose.ui.graphics.Path().apply {
                moveTo(c, c * 1.15f)
                cubicTo(c * 0.25f, c * 0.75f, c * 0.35f, c * 0.35f, c * 0.62f, c * 0.4f)
                cubicTo(c * 0.78f, c * 0.42f, c * 0.93f, c * 0.52f, c, c * 0.7f)
                cubicTo(c * 1.07f, c * 0.52f, c * 1.22f, c * 0.42f, c * 1.38f, c * 0.4f)
                cubicTo(c * 1.65f, c * 0.35f, c * 1.75f, c * 0.75f, c, c * 1.15f)
                close()
            }
            drawPath(heartPath, color = AccentPink)
        }
    }
}