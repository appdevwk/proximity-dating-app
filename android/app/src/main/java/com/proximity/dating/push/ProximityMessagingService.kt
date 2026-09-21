package com.proximity.dating.push

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.proximity.dating.DatingApp
import com.proximity.dating.MainActivity
import com.proximity.dating.util.appContainer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Displays push notifications for new matches and messages. Safe to leave in
 * the manifest even when Firebase isn't configured yet (no traffic flows).
 */
class ProximityMessagingService : FirebaseMessagingService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val container = applicationContext.appContainer()
        container.sessionManager.pushToken = token
        scope.launch {
            container.deviceRepository.register()
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        notifyUser(message)
    }

    private fun notifyUser(message: RemoteMessage) {
        val data = message.data
        val title = data["title"] ?: message.notification?.title ?: "Proximity"
        val body = data["body"] ?: message.notification?.body ?: ""
        val type = data["type"] ?: "system"

        val channel = when (type) {
            "message" -> DatingApp.CHANNEL_MESSAGES
            "match" -> DatingApp.CHANNEL_MATCHES
            else -> DatingApp.CHANNEL_SYSTEM
        }

        // Deep link straight into the matching conversation when possible.
        val contentIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val pending = PendingIntent.getActivity(
            this,
            data["conversationUserId"]?.hashCode() ?: 0,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, channel)
            .setSmallIcon(com.proximity.dating.R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()

        runCatching {
            if (NotificationManagerCompat.from(this).areNotificationsEnabled()) {
                NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), notification)
            }
        }
    }
}