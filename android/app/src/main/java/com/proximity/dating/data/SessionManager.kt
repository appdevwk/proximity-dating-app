package com.proximity.dating.data

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

/**
 * Small SharedPreferences-backed store for the session cookie, the logged-in
 * user identity, the persistent device id and the latest push token.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("proximity_session", Context.MODE_PRIVATE)

    var sessionCookieValue: String?
        get() = prefs.getString(KEY_COOKIE, null)
        private set(value) {
            prefs.edit().putString(KEY_COOKIE, value).apply()
        }

    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(value) = prefs.edit().putString(KEY_USER_ID, value).apply()

    var userEmail: String?
        get() = prefs.getString(KEY_EMAIL, null)
        set(value) = prefs.edit().putString(KEY_EMAIL, value).apply()

    var userName: String?
        get() = prefs.getString(KEY_NAME, null)
        set(value) = prefs.edit().putString(KEY_NAME, value).apply()

    var pushToken: String?
        get() = prefs.getString(KEY_PUSH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_PUSH_TOKEN, value).apply()

    var notificationsEnabled: Boolean
        get() = prefs.getBoolean(KEY_NOTIFICATIONS, true)
        set(value) = prefs.edit().putBoolean(KEY_NOTIFICATIONS, value).apply()

    val deviceId: String
        get() = prefs.getString(KEY_DEVICE_ID, null)
            ?: UUID.randomUUID().toString().also {
                prefs.edit().putString(KEY_DEVICE_ID, it).apply()
            }

    val isLoggedIn: Boolean
        get() = sessionCookieValue != null

    fun saveSessionCookie(value: String) {
        sessionCookieValue = value
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_COOKIE)
            .remove(KEY_USER_ID)
            .remove(KEY_EMAIL)
            .remove(KEY_NAME)
            .apply()
    }

    private companion object {
        const val KEY_COOKIE = "proximity_session"
        const val KEY_USER_ID = "user_id"
        const val KEY_EMAIL = "user_email"
        const val KEY_NAME = "user_name"
        const val KEY_PUSH_TOKEN = "push_token"
        const val KEY_NOTIFICATIONS = "notifications_enabled"
        const val KEY_DEVICE_ID = "device_id"
    }
}