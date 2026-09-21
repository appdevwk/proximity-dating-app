package com.proximity.dating.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.proximity.dating.data.SessionManager
import kotlinx.serialization.json.Json
import okhttp3.Cache
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.HttpException
import retrofit2.Retrofit
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

object NetworkProvider {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
        isLenient = true
    }

    fun createApi(sessionManager: SessionManager): ApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val cacheDir = File(System.getProperty("java.io.tmpdir"), "proximity-http")

        val client = OkHttpClient.Builder()
            .cookieJar(SessionCookieJar(sessionManager))
            .cache(Cache(cacheDir, 8L * 1024 * 1024))
            .addInterceptor(logging)
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(ApiConfig.baseUrl)
            .client(client)
            .addConverterFactory(
                json.asConverterFactory("application/json".toMediaType())
            )
            .build()
            .create(ApiService::class.java)
    }
}

/**
 * Wraps a suspend API call in a Kotlin Result, translating transport and HTTP
 * failures into a friendly [ApiException] seeded from the server's `error`
 * field (or a sensible fallback).
 */
suspend fun <T> apiCall(block: suspend () -> T): Result<T> {
    return try {
        Result.success(block())
    } catch (e: HttpException) {
        val message = parseApiError(e) ?: "Request failed (${e.code()})"
        Result.failure(ApiException(message))
    } catch (e: IOException) {
        Result.failure(ApiException("Network error. Check your connection."))
    } catch (e: Exception) {
        Result.failure(ApiException(e.message ?: "Unexpected error"))
    }
}

private val errorJson = Json { ignoreUnknownKeys = true }

private fun parseApiError(e: HttpException): String? {
    return try {
        val body = e.response()?.errorBody()?.string() ?: return null
        val dto = errorJson.decodeFromString<ApiErrorDto>(body)
        dto.error ?: dto.details?.firstOrNull()?.message ?: dto.message
    } catch (_: Exception) {
        null
    }
}