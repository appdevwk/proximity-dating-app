package com.proximity.dating.data

import com.proximity.dating.network.ApiException
import com.proximity.dating.network.ApiService
import com.proximity.dating.network.LoginRequest
import com.proximity.dating.network.LoginResponse
import com.proximity.dating.network.LogoutResponse
import com.proximity.dating.network.RegisterRequest
import com.proximity.dating.network.RegisterResponse
import com.proximity.dating.network.UserMe
import com.proximity.dating.network.apiCall

class AuthRepository(
    private val api: ApiService,
    private val session: SessionManager,
) {

    suspend fun login(email: String, password: String): Result<LoginResponse> = apiCall {
        api.login(LoginRequest(email = email, password = password))
    }.onSuccess { response ->
        response.user?.let {
            session.userId = it.id
            session.userEmail = it.email
            session.userName = it.name
        }
    }

    suspend fun register(
        email: String,
        password: String,
        name: String,
        dateOfBirth: String,
    ): Result<RegisterResponse> = apiCall {
        api.register(
            RegisterRequest(
                email = email,
                password = password,
                name = name,
                dateOfBirth = dateOfBirth,
            )
        )
    }.onSuccess { response ->
        response.user?.let {
            session.userId = it.id
            session.userEmail = it.email
            session.userName = it.name
        }
    }

    suspend fun logout(): Result<LogoutResponse> = apiCall { api.logout() }

    /** Validates whether the persisted cookie still authenticates. */
    suspend fun isAuthenticated(): Boolean {
        if (!session.sessionCookieValue.isNullOrEmpty()) {
            return apiCall { api.me() }.isSuccess
        }
        return false
    }

    suspend fun me(): Result<UserMe> = apiCall { api.me() }

    fun clearLocalSession() {
        session.clearSession()
    }

    fun reject401(t: Throwable): Boolean = t is ApiException && t.message == "Unauthorized"
}