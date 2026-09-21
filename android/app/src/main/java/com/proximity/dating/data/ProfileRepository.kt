package com.proximity.dating.data

import com.proximity.dating.network.ApiService
import com.proximity.dating.network.ConsentRequest
import com.proximity.dating.network.ConsentResponse
import com.proximity.dating.network.PhotoUploadResponse
import com.proximity.dating.network.ProfileUpdate
import com.proximity.dating.network.PreferencesUpdate
import com.proximity.dating.network.UpdateMeRequest
import com.proximity.dating.network.UpdateMeResponse
import com.proximity.dating.network.UserMe
import com.proximity.dating.network.apiCall
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody

class ProfileRepository(private val api: ApiService) {

    suspend fun me(): Result<UserMe> = apiCall { api.me() }

    suspend fun update(
        profile: ProfileUpdate? = null,
        preferences: PreferencesUpdate? = null,
    ): Result<UpdateMeResponse> =
        apiCall { api.updateMe(UpdateMeRequest(profile = profile, preferences = preferences)) }

    suspend fun consent(): Result<ConsentResponse> =
        apiCall { api.consent(ConsentRequest(ageDeclaration = true, termsAccepted = true)) }

    suspend fun uploadPhoto(bytes: ByteArray, mimeType: String): Result<PhotoUploadResponse> =
        apiCall {
            val body: RequestBody = bytes.toRequestBody(mimeType.toMediaType())
            val part = MultipartBody.Part.createFormData("file", "profile.${mimeType.substringAfter('/')}", body)
            api.uploadPhoto(part)
        }
}