package com.proximity.dating.util

import android.content.Context
import com.proximity.dating.DatingApp
import com.proximity.dating.data.AppContainer
import com.proximity.dating.network.ApiConfig

/** Access to the app's dependency container from anywhere a Context exists. */
fun Context.appContainer(): AppContainer = (applicationContext as DatingApp).container

/** Resolves a possibly-relative /api/... path to a full URL. */
fun resolveImageUrl(path: String?): String? {
    if (path.isNullOrBlank()) return null
    return if (path.startsWith("http")) path else ApiConfig.baseUrl.trimEnd('/') + path
}

fun formatDistance(miles: Double?): String? = miles?.let { "${it.roundTo1()} mi" }

fun Double.roundTo1(): String = String.format(java.util.Locale.US, "%.1f", this)