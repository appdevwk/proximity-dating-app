package com.proximity.dating.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.proximity.dating.data.AuthRepository
import com.proximity.dating.data.DeviceRepository
import com.proximity.dating.data.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    data object Checking : AuthUiState
    data class Ready(val isLoggedIn: Boolean) : AuthUiState
}

data class FormState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val deviceRepository: DeviceRepository,
    private val session: SessionManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Checking)
    val uiState = _uiState.asStateFlow()

    private val _login = MutableStateFlow(FormState())
    val loginState = _login.asStateFlow()

    private val _register = MutableStateFlow(FormState())
    val registerState = _register.asStateFlow()

    init {
        refreshSession()
    }

    fun refreshSession() {
        viewModelScope.launch {
            val ok = authRepository.isAuthenticated()
            if (ok) {
                deviceRepository.register().onFailure { /* non-fatal push/device sync */ }
            }
            _uiState.value = AuthUiState.Ready(ok)
        }
    }

    fun login(email: String, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _login.value = FormState(loading = true)
            authRepository.login(email.trim(), password)
                .onSuccess {
                    deviceRepository.register()
                    _login.value = FormState(success = true)
                    onSuccess()
                }
                .onFailure { t ->
                    _login.value = FormState(error = t.message ?: "Failed to log in")
                }
        }
    }

    fun register(
        name: String,
        email: String,
        password: String,
        dateOfBirth: String,
        onSuccess: () -> Unit,
    ) {
        viewModelScope.launch {
            _register.value = FormState(loading = true)
            authRepository.register(
                email = email.trim(),
                password = password,
                name = name.trim(),
                dateOfBirth = dateOfBirth,
            )
                .onSuccess {
                    deviceRepository.register()
                    _register.value = FormState(success = true)
                    onSuccess()
                }
                .onFailure { t ->
                    _register.value = FormState(error = t.message ?: "Failed to register")
                }
        }
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            authRepository.clearLocalSession()
            session.clearSession()
            onLoggedOut()
        }
    }

    fun consumeLoginError() {
        _login.value = _login.value.copy(error = null)
    }

    fun consumeRegisterError() {
        _register.value = _register.value.copy(error = null)
    }
}