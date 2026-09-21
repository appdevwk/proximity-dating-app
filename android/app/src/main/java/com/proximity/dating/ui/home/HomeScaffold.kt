package com.proximity.dating.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.proximity.dating.ui.discover.DiscoverScreen
import com.proximity.dating.ui.discover.DiscoverViewModel
import com.proximity.dating.ui.matches.MatchesScreen
import com.proximity.dating.ui.matches.MatchesViewModel
import com.proximity.dating.ui.profile.ProfileScreen
import com.proximity.dating.ui.profile.ProfileViewModel

private enum class HomeTab(val label: String) {
    Discover("Discover"),
    Chats("Chats"),
    Profile("Profile"),
}

@Composable
fun HomeScaffold(
    discoverViewModel: DiscoverViewModel,
    matchesViewModel: MatchesViewModel,
    profileViewModel: ProfileViewModel,
    onOpenConversation: (userId: String, displayName: String) -> Unit,
    onEditProfile: () -> Unit,
    onLogout: () -> Unit,
) {
    var selected by rememberSaveable { mutableIntStateOf(0) }
    val tabs = HomeTab.entries

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selected == index,
                        onClick = { selected = index },
                        icon = {
                            Icon(
                                imageVector = when (tab) {
                                    HomeTab.Discover -> Icons.Filled.Explore
                                    HomeTab.Chats -> Icons.Filled.ChatBubble
                                    HomeTab.Profile -> Icons.Filled.Person
                                },
                                contentDescription = tab.label,
                            )
                        },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tabs[selected]) {
                HomeTab.Discover -> DiscoverScreen(discoverViewModel)
                HomeTab.Chats -> MatchesScreen(
                    viewModel = matchesViewModel,
                    onOpenConversation = onOpenConversation,
                )
                HomeTab.Profile -> ProfileScreen(
                    viewModel = profileViewModel,
                    onEdit = onEditProfile,
                    onLogout = onLogout,
                )
            }
        }
    }
}