package com.proximity.dating.data

import com.proximity.dating.network.ApiService
import com.proximity.dating.network.ConversationResponse
import com.proximity.dating.network.ConversationsResponse
import com.proximity.dating.network.MatchesResponse
import com.proximity.dating.network.SendMessageRequest
import com.proximity.dating.network.SendMessageResponse
import com.proximity.dating.network.apiCall

class ChatRepository(private val api: ApiService) {

    suspend fun conversations(): Result<ConversationsResponse> =
        apiCall { api.conversations() }

    suspend fun getMatches(limit: Int = 50): Result<MatchesResponse> =
        apiCall { api.matches(limit = limit) }

    suspend fun conversation(userId: String): Result<ConversationResponse> =
        apiCall { api.conversation(userId) }

    suspend fun sendMessage(userId: String, content: String): Result<SendMessageResponse> =
        apiCall { api.sendMessage(SendMessageRequest(receiverId = userId, content = content)) }
}