package com.proximity.dating.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.zIndex
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.proximity.dating.data.DiscoverRepository
import com.proximity.dating.network.DiscoverProfile
import com.proximity.dating.ui.components.AsyncAvatar
import com.proximity.dating.ui.components.ProfileHeader
import com.proximity.dating.ui.components.FullScreenLoading
import com.proximity.dating.ui.components.ErrorState
import com.proximity.dating.ui.components.EmptyState
import com.proximity.dating.ui.theme.AccentPink
import com.proximity.dating.ui.theme.LikeGreen
import com.proximity.dating.ui.theme.NopeRed
import com.proximity.dating.ui.theme.SuperBlue
import com.proximity.dating.util.resolveImageUrl
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

@Composable
fun DiscoverScreen(
    viewModel: DiscoverViewModel,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        modifier = modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->

        Box(Modifier.padding(padding).fillMaxSize()) {
            when (val s = state) {
                is DiscoverUiState.Loading -> FullScreenLoading()
                is DiscoverUiState.Error -> ErrorState(s.message, onRetry = { viewModel.refresh() })
                is DiscoverUiState.Loaded -> {
                    if (s.profiles.isEmpty()) {
                        EmptyState(
                            title = "No one around right now",
                            subtitle = s.message ?: "Check back soon for new people nearby.",
                        )
                    } else {
                        Column(Modifier.fillMaxSize().padding(12.dp)) {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                            ) {
                                val stack = s.profiles.take(3)
                                stack.forEachIndexed { index, profile ->
                                    DiscoverCard(
                                        profile = profile,
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(horizontal = 6.dp)
                                            .zIndex((3 - index).toFloat())
.graphicsLayer {
                                        translationY = (3 - index) * 16.dp.toPx()
                                        scaleX = 1f - index * 0.05f
                                        scaleY = 1f - index * 0.05f
                                    },
                                        draggable = index == 0,
                                        onSwipe = { profile, action ->
                                            viewModel.swipe(profile, action) { isMatch ->
                                                if (isMatch) {
                                                    scope.launch {
                                                        snackbarHostState.showSnackbar("It's a match! 🎉")
                                                    }
                                                }
                                            }
                                        },
                                    )
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            ActionButtons(
                                enabled = true,
                                onLike = { viewModel.swipe(topProfile(s), DiscoverRepository.SwipeAction.LIKE) {} },
                                onNope = { viewModel.swipe(topProfile(s), DiscoverRepository.SwipeAction.NOPE) {} },
                                onSuperLike = { viewModel.swipe(topProfile(s), DiscoverRepository.SwipeAction.SUPER_LIKE) {} },
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun topProfile(s: DiscoverUiState.Loaded): DiscoverProfile? = s.profiles.firstOrNull()

/**
 * A single swipeable profile card. Only the top card is interactive; the rest
 * of the stack renders a static preview behind it.
 */
@Composable
private fun DiscoverCard(
    profile: DiscoverProfile,
    modifier: Modifier = Modifier,
    draggable: Boolean,
    onSwipe: (DiscoverProfile, DiscoverRepository.SwipeAction) -> Unit,
) {
    var dragX by remember(profile.id) { mutableFloatStateOf(0f) }
    var dragY by remember(profile.id) { mutableFloatStateOf(0f) }
    val threshold = 220f

    val subtitle = listOfNotNull(
        profile.location,
        profile.distanceMiles?.let { "${it.roundToInt()} mi" },
    ).joinToString(" · ")

    Box(
        modifier = modifier
            .offset { IntOffset(dragX.roundToInt(), dragY.roundToInt()) }
            .graphicsLayer { rotationZ = (dragX / 60f).coerceIn(-12f, 12f) }
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surface)
            .pointerInput(profile.id, draggable) {
                if (!draggable) return@pointerInput
                detectDragGestures(
                    onDragEnd = {
                        when {
                            dragX > threshold -> onSwipe(profile, DiscoverRepository.SwipeAction.LIKE)
                            dragX < -threshold -> onSwipe(profile, DiscoverRepository.SwipeAction.NOPE)
                            dragY > 340f -> onSwipe(profile, DiscoverRepository.SwipeAction.SUPER_LIKE)
                        }
                        dragX = 0f
                        dragY = 0f
                    },
                    onDrag = { change, amount ->
                        change.consume()
                        dragX += amount.x
                        dragY += amount.y
                    },
                )
            },
    ) {
        val imageUrl = resolveImageUrl(profile.profilePicture)
        if (imageUrl != null) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                AsyncAvatar(url = null, name = profile.displayName, modifier = Modifier.size(96.dp))
            }
        }

        // Scrim so text stays readable.
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f)),
                        startY = 300f,
                    )
                )
        )

        Column(
            Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${profile.displayName}, ${profile.age}",
                    color = Color.White,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                )
                if (profile.userVerified) {
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        imageVector = androidx.compose.material.icons.Icons.Filled.Verified,
                        contentDescription = "Verified",
                        tint = Color(0xFF4FC3F7),
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
            if (subtitle.isNotBlank()) {
                Text(
                    text = subtitle,
                    color = Color(0xFFD6CEF0),
                    fontSize = 14.sp,
                )
            }
            if (!profile.bio.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = profile.bio,
                    color = Color(0xFFEDE7FA),
                    fontSize = 14.sp,
                    maxLines = 3,
                )
            }
        }

        // Swipe stamps.
        SwipeStamp(
            text = "LIKE",
            color = LikeGreen,
            visible = dragX > 60f,
            modifier = Modifier.align(Alignment.TopStart).padding(16.dp).rotate(-18f),
        )
        SwipeStamp(
            text = "NOPE",
            color = NopeRed,
            visible = dragX < -60f,
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp).rotate(18f),
        )
        SwipeStamp(
            text = "SUPER LIKE",
            color = SuperBlue,
            visible = dragY > 120f,
            modifier = Modifier.align(Alignment.TopStart).padding(16.dp),
        )
    }
}

@Composable
private fun SwipeStamp(
    text: String,
    color: Color,
    visible: Boolean,
    modifier: Modifier = Modifier,
) {
    if (visible) {
        Box(
            modifier = modifier
                .background(color, RoundedCornerShape(8.dp))
                .padding(horizontal = 12.dp, vertical = 6.dp),
        ) {
            Text(text, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
        }
    }
}

@Composable
private fun ActionButtons(
    enabled: Boolean,
    onLike: () -> Unit,
    onNope: () -> Unit,
    onSuperLike: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ActionButton(NopeRed, Icons.Filled.Clear, onNope, enabled)
        FloatingActionButton(
            onClick = onSuperLike,
            containerColor = SuperBlue,
            contentColor = Color.White,
        ) {
            Icon(Icons.Filled.Star, contentDescription = "Super like")
        }
        ActionButton(LikeGreen, Icons.Filled.Favorite, onLike, enabled)
    }
}

@Composable
private fun ActionButton(
    color: Color,
    icon: ImageVector,
    onClick: () -> Unit,
    enabled: Boolean,
) {
    androidx.compose.material3.FilledIconButton(
        onClick = onClick,
        enabled = enabled,
        colors = androidx.compose.material3.IconButtonDefaults.filledIconButtonColors(
            containerColor = color,
            contentColor = Color.White,
        ),
        modifier = Modifier.size(56.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color.White)
    }
}