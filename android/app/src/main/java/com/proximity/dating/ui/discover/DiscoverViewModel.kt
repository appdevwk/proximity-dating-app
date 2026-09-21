package com.proximity.dating.ui.discover

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.proximity.dating.data.DiscoverRepository
import com.proximity.dating.network.DiscoverProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface DiscoverUiState {
    data object Loading : DiscoverUiState
    data class Loaded(
        val profiles: List<DiscoverProfile>,
        val hasMore: Boolean,
        val message: String? = null,
    ) : DiscoverUiState
    data class Error(val message: String) : DiscoverUiState
}

class DiscoverViewModel(
    private val repository: DiscoverRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<DiscoverUiState>(DiscoverUiState.Loading)
    val uiState = _uiState.asStateFlow()

    private var offset = 0
    private var total = 0
    private var loadingMore = false

    init {
        refresh()
    }

    fun refresh() {
        loadingMore = true
        viewModelScope.launch {
            _uiState.value = DiscoverUiState.Loading
            repository.discover(limit = 20, offset = 0).fold(
                onSuccess = { response ->
                    offset = response.profiles.size
                    total = response.total
                    _uiState.value = DiscoverUiState.Loaded(
                        profiles = response.profiles,
                        hasMore = offset < total,
                        message = response.message,
                    )
                },
                onFailure = { t ->
                    _uiState.value = DiscoverUiState.Error(
                        t.message ?: "Couldn't load profiles. Try again."
                    )
                },
            )
            loadingMore = false
        }
    }

    /** Sends the swipe and removes the profile from the deck. */
    fun swipe(profile: DiscoverProfile, action: DiscoverRepository.SwipeAction, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val result = repository.swipe(profile.id, action)
            val wasMatch = result.getOrNull()?.isNewMatch == true
            onResult(wasMatch)

            val current = _uiState.value as? DiscoverUiState.Loaded ?: return@launch
            val remaining = current.profiles.filterNot { it.id == profile.id }
            if (remaining.isEmpty()) {
                loadMore()
            } else {
                _uiState.value = current.copy(profiles = remaining)
            }
        }
    }

    private fun loadMore() {
        if (loadingMore || offset >= total) return
        loadingMore = true
        viewModelScope.launch {
            repository.discover(limit = 20, offset = offset).fold(
                onSuccess = { response ->
                    offset += response.profiles.size
                    total = response.total
                    val current = _uiState.value as? DiscoverUiState.Loaded
                    if (current != null) {
                        _uiState.value = current.copy(
                            profiles = current.profiles + response.profiles,
                            hasMore = offset < total,
                        )
                    }
                },
                onFailure = { /* keep what we have */ },
            )
            loadingMore = false
        }
    }
}