package com.proximity.dating.ui.matches

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.proximity.dating.data.ChatRepository
import com.proximity.dating.network.ConversationDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface MatchesUiState {
    data object Loading : MatchesUiState
    data class Loaded(val conversations: List<ConversationDto>) : MatchesUiState
    data class Error(val message: String) : MatchesUiState
}

class MatchesViewModel(private val repository: ChatRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<MatchesUiState>(MatchesUiState.Loading)
    val uiState = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = MatchesUiState.Loading
            repository.conversations().fold(
                onSuccess = { response ->
                    _uiState.value =
                        MatchesUiState.Loaded(response.conversations)
                },
                onFailure = { t ->
                    _uiState.value = MatchesUiState.Error(
                        t.message ?: "Couldn't load your matches."
                    )
                },
            )
        }
    }
}