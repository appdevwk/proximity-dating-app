package com.proximity.dating.push

import com.google.firebase.messaging.FirebaseMessaging
import com.proximity.dating.data.AppContainer
import kotlinx.coroutines.tasks.await

/**
 * Keeps the backend's device registry in sync: pulls an FCM token (when
 * Firebase is configured) and registers the device after login.
 */
object PushTokenRegistrar {

    suspend fun refreshAndRegister(container: AppContainer) {
        if (!container.sessionManager.isLoggedIn) return

        // Firebase is optional here; without google-services.json this simply
        // no-ops rather than crashing the app at boot.
        runCatching {
            val token = FirebaseMessaging.getInstance().token.await()
            container.sessionManager.pushToken = token
            container.deviceRepository.updatePushToken(token)
        }

        container.deviceRepository.register()
    }
}