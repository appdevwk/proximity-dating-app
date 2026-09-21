package com.proximity.dating

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import com.proximity.dating.data.AppContainer
import com.proximity.dating.push.PushTokenRegistrar
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class DatingApp : Application() {

    val container: AppContainer by lazy { AppContainer(this) }

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        appScope.launch {
            PushTokenRegistrar.refreshAndRegister(container)
        }
    }

    private fun createNotificationChannels() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_MATCHES,
                "Matches",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "New matches and likes"
            }
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "New messages from your matches"
            }
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_SYSTEM,
                "Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Account and product updates"
            }
        )
    }

    companion object {
        const val CHANNEL_MATCHES = "matches"
        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_SYSTEM = "system"
    }
}