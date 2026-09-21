package com.proximity.dating.data

import android.content.Context
import com.proximity.dating.network.ApiService
import com.proximity.dating.network.NetworkProvider

/**
 * Manual dependency root. Everything the UI layer needs is reachable from
 * here via `(application as DatingApp).container`.
 */
class AppContainer(context: Context) {

    val sessionManager: SessionManager = SessionManager(context)

    val api: ApiService = NetworkProvider.createApi(sessionManager)

    val authRepository: AuthRepository by lazy { AuthRepository(api, sessionManager) }
    val discoverRepository: DiscoverRepository by lazy { DiscoverRepository(api) }
    val chatRepository: ChatRepository by lazy { ChatRepository(api) }
    val profileRepository: ProfileRepository by lazy { ProfileRepository(api) }
    val deviceRepository: DeviceRepository by lazy { DeviceRepository(api, sessionManager) }
}