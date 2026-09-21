package com.proximity.dating.ui.conversation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.proximity.dating.data.ChatRepository
import com.proximity.dating.network.MessageOutDto
import com.proximity.dating.network.ConversationUserDto
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

sealed interface ConversationUiState {
    data object Loading : ConversationUiState
    data class Loaded(
        val user: ConversationUserDto?,
        val messages: List<MessageOutDto>,
    ) : ConversationUiState
    data class Error(val message: String) : ConversationUiState
}

class ConversationViewModel(
    private val repository: ChatRepository,
    private val userId: String,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ConversationUiState>(ConversationUiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _sending = MutableStateFlow(false)
    val sending = _sending.asStateFlow()

    private val _sendError = MutableStateFlow<String?>(null)
    val sendError = _sendError.asStateFlow()

    private var pollJob: kotlinx.coroutines.Job? = null

    init {
        load()
        pollJob = viewModelScope.launch {
            while (isActive) {
                delay(5000)
                load()
            }
        }
    }

    fun load() {
        viewModelScope.launch {
            repository.conversation(userId).fold(
                onSuccess = { response ->
                    val current = _uiState.value
                    if (current is ConversationUiState.Loaded) {
                        _uiState.value = current.copy(
                            messages = response.messages,
                            user = response.user ?: current.user,
                        )
                    } else {
                        _uiState.value = ConversationUiState.Loaded(
                            user = response.user,
                            messages = response.messages,
                        )
                    }
                },
                onFailure = { t ->
                    if (_uiState.value !is ConversationUiState.Loaded) {
                        _uiState.value = ConversationUiState.Error(
                            t.message ?: "Couldn't open this conversation."
                        )
                    }
                },
            )
        }
    }

    fun send(content: String, onSent: () -> Unit) {
        if (content.isBlank() || _sending.value) return
        viewModelScope.launch {
            _sending.value = true
            _sendError.value = null
            repository.sendMessage(userId, content.trim())
                .onSuccess { response ->
                    response.message?.let { message ->
                        val current = _uiState.value
                        if (current is ConversationUiState.Loaded) {
                            _uiState.value = current.copy(
                                messages = current.messages + message,
                            )
                        }
                    }
                    onSent()
                }
                .onFailure { t ->
                    _sendError.value = t.message ?: "Couldn't send message"
                }
            _sending.value = false
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
        super.onCleared()
    }
}