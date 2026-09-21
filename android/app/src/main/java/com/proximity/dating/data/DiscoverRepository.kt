package com.proximity.dating.data

import com.proximity.dating.network.ApiService
import com.proximity.dating.network.DiscoverResponse
import com.proximity.dating.network.SwipeRequest
import com.proximity.dating.network.SwipeResponse
import com.proximity.dating.network.apiCall

class DiscoverRepository(private val api: ApiService) {

    suspend fun discover(limit: Int = 20, offset: Int = 0): Result<DiscoverResponse> =
        apiCall { api.discover(limit = limit, offset = offset) }

    suspend fun swipe(targetProfileId: String, action: SwipeAction): Result<SwipeResponse> =
        apiCall { api.swipe(SwipeRequest(targetProfileId = targetProfileId, action = action.wire)) }

    enum class SwipeAction(val wire: String) {
        LIKE("like"),
        NOPE("dislike"),
        SUPER_LIKE("super_like"),
    }
}