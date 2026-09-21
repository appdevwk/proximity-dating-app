package com.proximity.dating.ui.conversation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.proximity.dating.network.MessageOutDto
import com.proximity.dating.ui.components.ErrorState
import com.proximity.dating.ui.components.FullScreenLoading
import com.proximity.dating.ui.components.VerifiedBadge
import com.proximity.dating.util.friendlyTimestamp

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun ConversationScreen(
    viewModel: ConversationViewModel,
    myUserId: String,
    displayName: String,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    val sending by viewModel.sending.collectAsState()
    val sendError by viewModel.sendError.collectAsState()
    var draft by rememberSaveable { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = (state as? ConversationUiState.Loaded)?.user?.displayName ?: displayName,
                            maxLines = 1,
                        )
                        if ((state as? ConversationUiState.Loaded)?.user?.userVerified == true) {
                            Spacer(Modifier.width(4.dp))
                            VerifiedBadge()
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (val s = state) {
                is ConversationUiState.Loading -> FullScreenLoading()
                is ConversationUiState.Error -> ErrorState(
                    message = s.message,
                    onRetry = { viewModel.load() },
                )
                is ConversationUiState.Loaded -> MessageThread(
                    messages = s.messages,
                    myUserId = myUserId,
                    onSend = {
                        if (draft.isNotBlank()) {
                            viewModel.send(draft) {
                                draft = ""
                            }
                        }
                    },
                    draft = draft,
                    onDraftChange = { draft = it },
                    sending = sending,
                    sendError = sendError,
                )
            }
        }
    }
}

@Composable
private fun MessageThread(
    messages: List<MessageOutDto>,
    myUserId: String,
    onSend: () -> Unit,
    draft: String,
    onDraftChange: (String) -> Unit,
    sending: Boolean,
    sendError: String?,
) {
    val listState = rememberLazyListState()
    val reversed = messages.reversed()

    LaunchedEffect(reversed.size) {
        if (reversed.isNotEmpty()) listState.scrollToItem(0)
    }

    Column(
        Modifier
            .fillMaxSize()
            .imePadding(),
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            reverseLayout = true,
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            items(reversed, key = { it.id }) { message ->
                MessageBubble(
                    message = message,
                    mine = message.senderId == myUserId,
                )
            }
        }

        sendError?.let {
            Text(
                text = it,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = draft,
                onValueChange = onDraftChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type a message...") },
                maxLines = 4,
                shape = RoundedCornerShape(24.dp),
            )
            Spacer(Modifier.width(8.dp))
            IconButton(
                onClick = onSend,
                enabled = draft.isNotBlank() && !sending,
            ) {
                if (sending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(
                        Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: MessageOutDto, mine: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
    ) {
        Column(
            modifier = Modifier.widthIn(max = 280.dp),
            horizontalAlignment = if (mine) Alignment.End else Alignment.Start,
        ) {
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (mine) 16.dp else 4.dp,
                            bottomEnd = if (mine) 4.dp else 16.dp,
                        )
                    )
                    .background(
                        if (mine) MaterialTheme.colorScheme.primaryContainer
                        else MaterialTheme.colorScheme.surfaceVariant
                    )
                    .padding(horizontal = 14.dp, vertical = 10.dp),
            ) {
                Text(
                    text = message.content,
                    color = if (mine) MaterialTheme.colorScheme.onPrimaryContainer
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = friendlyTimestamp(message.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
            )
        }
    }
}