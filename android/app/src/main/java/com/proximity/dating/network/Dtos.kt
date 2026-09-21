package com.proximity.dating.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ---------------------------------------------------------------------------
// DTO mirror of the Proximity Next.js API (/api/*). Field names match the
// wire format exactly; `ignoreUnknownKeys` is enabled globally in
// NetworkProvider so new server fields never break the client.
// ---------------------------------------------------------------------------

@Serializable
data class ApiErrorDto(
    val error: String? = null,
    val message: String? = null,
    val details: List<ValidationIssueDto>? = null,
)

@Serializable
data class ValidationIssueDto(
    val message: String? = null,
)

// --- Auth -----------------------------------------------------------------

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    @SerialName("dateOfBirth") val dateOfBirth: String,
    @SerialName("ageDeclaration") val ageDeclaration: Boolean = true,
    @SerialName("termsAccepted") val termsAccepted: Boolean = true,
    @SerialName("siteMode") val siteMode: String = "both",
)

@Serializable
data class LoginResponse(
    val message: String? = null,
    val session: String? = null,
    val user: AuthUserDto? = null,
)

@Serializable
data class RegisterResponse(
    val message: String? = null,
    val user: AuthUserDto? = null,
    @SerialName("requiresAgeVerification") val requiresAgeVerification: Boolean? = null,
    @SerialName("requiresProfileVerification") val requiresProfileVerification: Boolean? = null,
    val session: String? = null,
)

@Serializable
data class AuthUserDto(
    val id: String,
    val email: String,
    val name: String? = null,
    val role: String? = null,
    @SerialName("ageVerified") val ageVerified: Boolean? = null,
)

@Serializable
data class LogoutResponse(
    val message: String? = null,
)

// --- Me / profile ---------------------------------------------------------

@Serializable
data class UserMe(
    val user: MeUserDto,
    val profile: ProfileOutDto? = null,
    val preferences: PreferencesOutDto? = null,
    val stats: StatsDto? = null,
    val verification: VerificationDto? = null,
)

@Serializable
data class MeUserDto(
    val id: String,
    val email: String,
    val name: String? = null,
    @SerialName("ageVerified") val ageVerified: Boolean = false,
    @SerialName("isBanned") val isBanned: Boolean = false,
    @SerialName("createdAt") val createdAt: String? = null,
)

@Serializable
data class ProfileOutDto(
    val id: String,
    @SerialName("displayName") val displayName: String,
    val bio: String? = null,
    val age: Int? = null,
    val gender: String? = null,
    @SerialName("interestedIn") val interestedIn: List<String> = emptyList(),
    val location: String? = null,
    @SerialName("profilePicture") val profilePicture: String? = null,
    @SerialName("isProfilePublic") val isProfilePublic: Boolean = true,
    @SerialName("showDistance") val showDistance: Boolean = true,
    @SerialName("ageVerified") val ageVerified: Boolean = false,
)

@Serializable
data class PreferencesOutDto(
    @SerialName("minAge") val minAge: Int = 18,
    @SerialName("maxAge") val maxAge: Int = 100,
    @SerialName("maxDistance") val maxDistance: Int = 50,
    @SerialName("interestedIn") val interestedIn: List<String> = emptyList(),
    @SerialName("relationshipType") val relationshipType: List<String> = emptyList(),
    @SerialName("lookingFor") val lookingFor: String? = null,
)

@Serializable
data class StatsDto(
    val matches: Int = 0,
    @SerialName("acceptedMatches") val acceptedMatches: Int = 0,
    val messages: Int = 0,
    @SerialName("unreadMessages") val unreadMessages: Int = 0,
    @SerialName("likesReceived") val likesReceived: Int = 0,
)

@Serializable
data class VerificationDto(
    @SerialName("ageDeclarationConfirmed") val ageDeclarationConfirmed: Boolean = false,
    @SerialName("termsAccepted") val termsAccepted: Boolean = false,
    @SerialName("photoVerified") val photoVerified: Boolean = false,
    @SerialName("idVerified") val idVerified: Boolean = false,
    @SerialName("livenessVerified") val livenessVerified: Boolean = false,
    val verified: Boolean = false,
    @SerialName("fullyVerified") val fullyVerified: Boolean = false,
)

@Serializable
data class UpdateMeRequest(
    val profile: ProfileUpdate? = null,
    val preferences: PreferencesUpdate? = null,
)

@Serializable
data class ProfileUpdate(
    @SerialName("displayName") val displayName: String? = null,
    val bio: String? = null,
    val gender: String? = null,
    @SerialName("interestedIn") val interestedIn: List<String>? = null,
    val location: String? = null,
    @SerialName("profilePicture") val profilePicture: String? = null,
)

@Serializable
data class PreferencesUpdate(
    @SerialName("minAge") val minAge: Int? = null,
    @SerialName("maxAge") val maxAge: Int? = null,
    @SerialName("maxDistance") val maxDistance: Int? = null,
    @SerialName("relationshipType") val relationshipType: List<String>? = null,
    @SerialName("lookingFor") val lookingFor: String? = null,
)

@Serializable
data class UpdateMeResponse(
    val message: String? = null,
    val me: UserMe? = null,
)

// --- Discover / swipe -----------------------------------------------------

@Serializable
data class DiscoverProfile(
    val id: String,
    @SerialName("userId") val userId: String,
    @SerialName("displayName") val displayName: String,
    val age: Int = 0,
    val gender: String? = null,
    @SerialName("interestedIn") val interestedIn: List<String> = emptyList(),
    val location: String? = null,
    val bio: String? = null,
    @SerialName("profilePicture") val profilePicture: String? = null,
    @SerialName("distanceMiles") val distanceMiles: Double? = null,
    @SerialName("userVerified") val userVerified: Boolean = false,
)

@Serializable
data class DiscoverResponse(
    val profiles: List<DiscoverProfile> = emptyList(),
    val total: Int = 0,
    val offset: Int = 0,
    val limit: Int = 20,
    val message: String? = null,
)

@Serializable
data class SwipeRequest(
    @SerialName("targetProfileId") val targetProfileId: String,
    val action: String,
)

@Serializable
data class SwipeResponse(
    val match: SwipeMatchDto? = null,
    @SerialName("isNewMatch") val isNewMatch: Boolean = false,
)

@Serializable
data class SwipeMatchDto(
    val id: String,
    @SerialName("user1Id") val user1Id: String? = null,
    @SerialName("user2Id") val user2Id: String? = null,
    val status: String? = null,
    @SerialName("createdAt") val createdAt: String? = null,
)

// --- Matches & messages ---------------------------------------------------

@Serializable
data class MatchSummary(
    val id: String,
    @SerialName("matchedAt") val matchedAt: String? = null,
    val user: ConversationUserDto,
)

@Serializable
data class MatchesResponse(
    val matches: List<MatchSummary> = emptyList(),
)

@Serializable
data class ConversationUserDto(
    @SerialName("userId") val userId: String,
    @SerialName("displayName") val displayName: String,
    @SerialName("profilePicture") val profilePicture: String? = null,
    @SerialName("userVerified") val userVerified: Boolean = false,
)

@Serializable
data class MessageOutDto(
    val id: String,
    val content: String,
    @SerialName("senderId") val senderId: String,
    @SerialName("receiverId") val receiverId: String,
    @SerialName("isRead") val isRead: Boolean = false,
    @SerialName("createdAt") val createdAt: String? = null,
)

@Serializable
data class ConversationDto(
    val user: ConversationUserDto,
    @SerialName("matchedAt") val matchedAt: String? = null,
    @SerialName("lastMessage") val lastMessage: MessageOutDto? = null,
    @SerialName("unreadCount") val unreadCount: Int = 0,
)

@Serializable
data class ConversationsResponse(
    val conversations: List<ConversationDto> = emptyList(),
)

@Serializable
data class ConversationResponse(
    val user: ConversationUserDto? = null,
    val messages: List<MessageOutDto> = emptyList(),
)

@Serializable
data class SendMessageRequest(
    @SerialName("receiverId") val receiverId: String,
    val content: String,
)

@Serializable
data class SendMessageResponse(
    val message: MessageOutDto? = null,
    val user: ConversationUserDto? = null,
)

// --- Verification ---------------------------------------------------------

@Serializable
data class ConsentRequest(
    @SerialName("ageDeclaration") val ageDeclaration: Boolean = true,
    @SerialName("termsAccepted") val termsAccepted: Boolean = true,
)

@Serializable
data class ConsentResponse(
    val message: String? = null,
    val verification: VerificationDto? = null,
)

// --- Photos ---------------------------------------------------------------

@Serializable
data class PhotoUploadResponse(
    val url: String? = null,
    val message: String? = null,
)

// --- Device registration / push ------------------------------------------

@Serializable
data class DeviceRequest(
    val action: String,
    @SerialName("deviceId") val deviceId: String? = null,
    val platform: String? = null,
    val model: String? = null,
    @SerialName("osVersion") val osVersion: String? = null,
    @SerialName("appVersion") val appVersion: String? = null,
    @SerialName("pushToken") val pushToken: String? = null,
    @SerialName("userId") val userId: String? = null,
    @SerialName("isNotificationsEnabled") val isNotificationsEnabled: Boolean? = null,
    val enabled: Boolean? = null,
)

@Serializable
data class DeviceResponse(
    val success: Boolean = false,
    val device: DeviceDto? = null,
)

@Serializable
data class DeviceDto(
    @SerialName("deviceId") val deviceId: String? = null,
    @SerialName("pushToken") val pushToken: String? = null,
)