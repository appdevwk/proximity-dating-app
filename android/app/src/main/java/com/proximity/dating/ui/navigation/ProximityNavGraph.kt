package com.proximity.dating.ui.navigation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.proximity.dating.ui.ProximityViewModelFactory
import com.proximity.dating.ui.auth.AuthViewModel
import com.proximity.dating.ui.conversation.ConversationScreen
import com.proximity.dating.ui.conversation.ConversationViewModel
import com.proximity.dating.ui.discover.DiscoverViewModel
import com.proximity.dating.ui.home.HomeScaffold
import com.proximity.dating.ui.matches.MatchesViewModel
import com.proximity.dating.ui.profile.EditProfileScreen
import com.proximity.dating.ui.profile.ProfileViewModel
import com.proximity.dating.ui.screens.LoginScreen
import com.proximity.dating.ui.screens.RegisterScreen
import com.proximity.dating.ui.screens.SplashScreen
import com.proximity.dating.ui.screens.WelcomeScreen
import com.proximity.dating.util.appContainer

object Routes {
    const val SPLASH = "splash"
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val HOME = "home"
    const val EDIT_PROFILE = "edit_profile"
    const val CONVERSATION = "conversation/{userId}?display={display}"
    fun conversation(userId: String, displayName: String): String =
        "conversation/${Uri.encode(userId)}?display=${Uri.encode(displayName)}"
}

@Composable
fun ProximityNavGraph() {
    val context = LocalContext.current
    val container = context.appContainer()
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            val vm: AuthViewModel = viewModel(
                factory = ProximityViewModelFactory {
                    AuthViewModel(container.authRepository, container.deviceRepository, container.sessionManager)
                }
            )
            SplashScreen(viewModel = vm) { isLoggedIn ->
                navController.navigate(
                    if (isLoggedIn) Routes.HOME else Routes.WELCOME
                ) {
                    popUpTo(Routes.SPLASH) { inclusive = true }
                }
            }
        }

        composable(Routes.WELCOME) {
            WelcomeScreen(
                onLogin = { navController.navigate(Routes.LOGIN) },
                onRegister = { navController.navigate(Routes.REGISTER) },
            )
        }

        composable(Routes.LOGIN) {
            val vm: AuthViewModel = viewModel(
                factory = ProximityViewModelFactory {
                    AuthViewModel(container.authRepository, container.deviceRepository, container.sessionManager)
                }
            )
            LoginScreen(
                viewModel = vm,
                onLoggedIn = { navController.goHome() },
                onForgotPassword = {},
            )
        }

        composable(Routes.REGISTER) {
            val vm: AuthViewModel = viewModel(
                factory = ProximityViewModelFactory {
                    AuthViewModel(container.authRepository, container.deviceRepository, container.sessionManager)
                }
            )
            RegisterScreen(
                viewModel = vm,
                onRegistered = { navController.goHome() },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Routes.HOME) {
            val discoverVm: DiscoverViewModel = viewModel(
                factory = ProximityViewModelFactory { DiscoverViewModel(container.discoverRepository) }
            )
            val matchesVm: MatchesViewModel = viewModel(
                factory = ProximityViewModelFactory { MatchesViewModel(container.chatRepository) }
            )
            val profileVm: ProfileViewModel = viewModel(
                factory = ProximityViewModelFactory { ProfileViewModel(container.profileRepository) }
            )
            val authVm: AuthViewModel = viewModel(
                factory = ProximityViewModelFactory {
                    AuthViewModel(container.authRepository, container.deviceRepository, container.sessionManager)
                }
            )

            LaunchedEffect(Unit) { matchesVm.load() }

            HomeScaffold(
                discoverViewModel = discoverVm,
                matchesViewModel = matchesVm,
                profileViewModel = profileVm,
                onOpenConversation = { userId, displayName ->
                    navController.navigate(Routes.conversation(userId, displayName))
                },
                onEditProfile = { navController.navigate(Routes.EDIT_PROFILE) },
                onLogout = {
                    authVm.logout {
                        navController.navigate(Routes.WELCOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                        }
                    }
                },
            )
        }

        composable(Routes.EDIT_PROFILE) {
            val vm: ProfileViewModel = viewModel(
                factory = ProximityViewModelFactory { ProfileViewModel(container.profileRepository) }
            )
            EditProfileScreen(
                viewModel = vm,
                onSaved = { navController.popBackStack() },
                onBack = { navController.popBackStack() },
            )
        }

        composable(Routes.CONVERSATION) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: ""
            val displayName = backStackEntry.arguments
                ?.getString("display") ?: ""
            val vm: ConversationViewModel = viewModel(
                factory = ProximityViewModelFactory {
                    ConversationViewModel(container.chatRepository, userId)
                }
            )
            val myUserId = container.sessionManager.userId ?: ""
            ConversationScreen(
                viewModel = vm,
                myUserId = myUserId,
                displayName = displayName,
                onBack = { navController.popBackStack() },
            )
        }
    }
}

private fun NavHostController.goHome() {
    navigate(Routes.HOME) {
        popUpTo(Routes.SPLASH) { inclusive = true }
    }
}