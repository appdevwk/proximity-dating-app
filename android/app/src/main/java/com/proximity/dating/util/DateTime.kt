package com.proximity.dating.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}

private val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
private val dateFormat = SimpleDateFormat("MMM d", Locale.getDefault())

/** "2025-08-10T21:04:29.746Z" -> friendly local label: today = time, else date. */
fun friendlyTimestamp(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val date = runCatching {
        if (iso.endsWith("Z")) {
            java.time.Instant.parse(iso).let { Date.from(it) }
        } else {
            // Needs fractional-seconds awareness; fall back to substring parse.
            inputFormat.parse(iso.substringBefore("."))
        }
    }.getOrNull() ?: return ""

    val now = System.currentTimeMillis()
    val isToday = date.time > now - 24 * 60 * 60 * 1000L
    return if (isToday) timeFormat.format(date) else dateFormat.format(date)
}