package com.proximity.dating.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.proximity.dating.data.ProfileRepository
import com.proximity.dating.network.ProfileUpdate
import com.proximity.dating.network.PreferencesUpdate
import com.proximity.dating.network.UserMe
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Loaded(val me: UserMe) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

data class SaveState(
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false,
)

class ProfileViewModel(private val repository: ProfileRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _saveState = MutableStateFlow(SaveState())
    val saveState = _saveState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            repository.me().fold(
                onSuccess = { me ->
                    _uiState.value = ProfileUiState.Loaded(me)
                    repository.consent() // refreshes auditable consent on login
                },
                onFailure = { t ->
                    _uiState.value = ProfileUiState.Error(
                        t.message ?: "Couldn't load your profile."
                    )
                },
            )
        }
    }

    fun save(
        profile: ProfileUpdate? = null,
        preferences: PreferencesUpdate? = null,
        onSaved: () -> Unit,
    ) {
        viewModelScope.launch {
            _saveState.value = SaveState(saving = true)
            repository.update(profile = profile, preferences = preferences)
                .fold(
                    onSuccess = { response ->
                        response.me?.let { me ->
                            _uiState.value = ProfileUiState.Loaded(me)
                        }
                        _saveState.value = SaveState(saved = true)
                        onSaved()
                    },
                    onFailure = { t ->
                        _saveState.value = SaveState(
                            error = t.message ?: "Couldn't save changes"
                        )
                    },
                )
        }
    }

    fun uploadPhoto(bytes: ByteArray, mimeType: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repository.uploadPhoto(bytes, mimeType)
                .fold(
                    onSuccess = { onDone() },
                    onFailure = { t ->
                        _saveState.value = SaveState(
                            error = t.message ?: "Couldn't upload photo"
                        )
                    },
                )
        }
    }
}