package com.proximity.dating.data

import android.os.Build
import com.proximity.dating.network.ApiService
import com.proximity.dating.network.DeviceRequest
import com.proximity.dating.network.DeviceResponse
import com.proximity.dating.network.apiCall

class DeviceRepository(
    private val api: ApiService,
    private val session: SessionManager,
) {

    val model: String get() = "${Build.MANUFACTURER} ${Build.MODEL}"

    val osVersion: String get() = Build.VERSION.RELEASE

    val appVersion: String get() = "1.0.0"

    /**
     * Registers this device with the backend. Called after login and whenever
     * the push token changes. Requires a logged-in user id.
     */
    suspend fun register(): Result<DeviceResponse> {
        val userId = session.userId ?: return Result.failure(IllegalStateException("Not logged in"))
        return apiCall {
            api.device(
                DeviceRequest(
                    action = "register",
                    deviceId = session.deviceId,
                    platform = "android",
                    model = model,
                    osVersion = osVersion,
                    appVersion = appVersion,
                    pushToken = session.pushToken,
                    userId = userId,
                    isNotificationsEnabled = session.notificationsEnabled,
                )
            )
        }
    }

    suspend fun updatePushToken(token: String): Result<DeviceResponse> {
        session.pushToken = token
        return apiCall {
            api.device(
                DeviceRequest(
                    action = "update-push-token",
                    deviceId = session.deviceId,
                    pushToken = token,
                )
            )
        }
    }

    suspend fun toggleNotifications(enabled: Boolean): Result<DeviceResponse> {
        session.notificationsEnabled = enabled
        return apiCall {
            api.device(
                DeviceRequest(
                    action = "toggle-notifications",
                    deviceId = session.deviceId,
                    enabled = enabled,
                )
            )
        }
    }
}