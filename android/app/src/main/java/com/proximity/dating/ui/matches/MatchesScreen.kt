package com.proximity.dating.ui.matches

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Badge
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.proximity.dating.network.ConversationDto
import com.proximity.dating.ui.components.AsyncAvatar
import com.proximity.dating.ui.components.EmptyState
import com.proximity.dating.ui.components.ErrorState
import com.proximity.dating.ui.components.FullScreenLoading
import com.proximity.dating.ui.components.VerifiedBadge
import com.proximity.dating.util.friendlyTimestamp

@Composable
fun MatchesScreen(
    viewModel: MatchesViewModel,
    onOpenConversation: (userId: String, displayName: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsState()

    Column(modifier.fillMaxSize()) {
        Text(
            text = "Chats",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
        )

        when (val s = state) {
            is MatchesUiState.Loading -> FullScreenLoading()
            is MatchesUiState.Error -> ErrorState(s.message, onRetry = { viewModel.load() })
            is MatchesUiState.Loaded -> {
                if (s.conversations.isEmpty()) {
                    EmptyState(
                        title = "No chats yet",
                        subtitle = "When you match with someone they'll show up here.",
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                    ) {
                        items(s.conversations, key = { it.user.userId }) { conversation ->
                            ConversationRow(
                                conversation = conversation,
                                onClick = {
                                    onOpenConversation(
                                        conversation.user.userId,
                                        conversation.user.displayName,
                                    )
                                },
                            )
                            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ConversationRow(
    conversation: ConversationDto,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AsyncAvatar(
            url = conversation.user.profilePicture,
            name = conversation.user.displayName,
            modifier = Modifier.size(52.dp),
        )
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = conversation.user.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (conversation.user.userVerified) {
                    Spacer(Modifier.width(4.dp))
                    VerifiedBadge()
                }
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = conversation.lastMessage?.content ?: "Say hello!",
                style = MaterialTheme.typography.bodyMedium,
                color = if (conversation.unreadCount > 0) {
                    MaterialTheme.colorScheme.onSurface
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Spacer(Modifier.width(8.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = friendlyTimestamp(conversation.lastMessage?.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (conversation.unreadCount > 0) {
                Spacer(Modifier.height(4.dp))
                Badge(
                    containerColor = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.clip(RoundedCornerShape(12.dp)),
                ) {
                    Text(
                        text = if (conversation.unreadCount > 99) "99+" else conversation.unreadCount.toString(),
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            }
        }
    }
}