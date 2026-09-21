package com.proximity.dating.network

import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit contract for the Proximity backend (Next.js, `/api/*`).
 * Auth is handled entirely by an HTTP-only session cookie (`proximity_session`)
 * that OkHttp's cookie jar persists across requests.
 */
interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): RegisterResponse

    @POST("auth/logout")
    suspend fun logout(): LogoutResponse

    @GET("user/me")
    suspend fun me(): UserMe

    @PUT("user/me")
    suspend fun updateMe(@Body body: UpdateMeRequest): UpdateMeResponse

    @GET("profiles/discover")
    suspend fun discover(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0,
    ): DiscoverResponse

    @POST("profiles/swipe")
    suspend fun swipe(@Body body: SwipeRequest): SwipeResponse

    @GET("matches")
    suspend fun matches(@Query("limit") limit: Int = 20): MatchesResponse

    @GET("messages")
    suspend fun conversations(): ConversationsResponse

    @GET("messages/{userId}")
    suspend fun conversation(@Path("userId") userId: String): ConversationResponse

    @POST("messages")
    suspend fun sendMessage(@Body body: SendMessageRequest): SendMessageResponse

    @POST("verification/consent")
    suspend fun consent(@Body body: ConsentRequest): ConsentResponse

    @Multipart
    @POST("profiles/photo")
    suspend fun uploadPhoto(@Part file: MultipartBody.Part): PhotoUploadResponse

    @POST("mobile/device")
    suspend fun device(@Body body: DeviceRequest): DeviceResponse
}

/** Exception carrying the human-readable message returned by the API. */
class ApiException(message: String) : Exception(message)