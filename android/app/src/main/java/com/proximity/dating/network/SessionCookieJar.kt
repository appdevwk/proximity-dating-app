package com.proximity.dating.network

import com.proximity.dating.data.SessionManager
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

/**
 * Persists the `proximity_session` cookie so the user stays logged in across
 * app restarts, and replays it on every request to the API host.
 */
class SessionCookieJar(
    private val sessionManager: SessionManager,
) : CookieJar {

    private val cookieStore = HashMap<String, MutableList<Cookie>>()

    init {
        sessionManager.sessionCookieValue?.let { value ->
            try {
                val rebuilt = Cookie.Builder()
                    .name(SESSION_COOKIE_NAME)
                    .value(value)
                    .domain(ApiConfig.baseHost)
                    .path("/")
                    .expiresAt(System.currentTimeMillis() + SESSION_MAX_AGE_MS)
                    .build()
                cookieStore[ApiConfig.baseHost] = mutableListOf(rebuilt)
            } catch (_: IllegalArgumentException) {
                // Corrupted stored cookie; the user simply needs to log in again.
            }
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val list = cookieStore.getOrPut(host) { mutableListOf() }
        cookies.filter { !it.expired() }.forEach { cookie ->
            list.removeAll { it.name == cookie.name && it.domain == cookie.domain && it.path == cookie.path }
            list.add(cookie)
            if (cookie.name == SESSION_COOKIE_NAME) {
                sessionManager.saveSessionCookie(cookie.value)
            }
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val host = url.host
        return cookieStore[host]?.filter { !it.expired() }.orEmpty()
    }

    // sign-out: forget cookies in memory
    fun clear() {
        cookieStore.clear()
        sessionManager.clearSession()
    }

    companion object {
        const val SESSION_COOKIE_NAME = "proximity_session"
        const val SESSION_MAX_AGE_MS: Long = 30L * 24 * 60 * 60 * 1000
    }
}

/** Base URL helpers derived from the compile-time API_BASE_URL. */
object ApiConfig {
    val baseUrl: String =
        BuildConfig.API_BASE_URL.trimEnd('/') + "/"

    val baseHost: String =
        runCatching {
            java.net.URI(BuildConfig.API_BASE_URL).host
        }.getOrNull() ?: "proximitygetadate.com"
}