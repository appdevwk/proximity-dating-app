package com.proximity.dating.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.proximity.dating.network.UserMe
import com.proximity.dating.ui.components.AsyncAvatar
import com.proximity.dating.ui.components.ErrorState
import com.proximity.dating.ui.components.FullScreenLoading
import com.proximity.dating.ui.components.VerifiedBadge
import com.proximity.dating.ui.theme.AccentPink

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onEdit: () -> Unit,
    onLogout: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    when (val s = state) {
        is ProfileUiState.Loading -> FullScreenLoading()
        is ProfileUiState.Error -> ErrorState(s.message, onRetry = { viewModel.load() })
        is ProfileUiState.Loaded -> ProfileContent(
            me = s.me,
            onEdit = onEdit,
            onLogout = onLogout,
        )
    }
}

@Composable
private fun ProfileContent(
    me: UserMe,
    onEdit: () -> Unit,
    onLogout: () -> Unit,
) {
    val profile = me.profile
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncAvatar(
                url = profile?.profilePicture,
                name = profile?.displayName ?: me.user.name,
                modifier = Modifier.size(80.dp),
            )
            Spacer(Modifier.width(16.dp))
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = profile?.displayName ?: me.user.name ?: "Member",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    if (verificationChips(me).isNotEmpty()) {
                        Spacer(Modifier.width(6.dp))
                        VerifiedBadge()
                    }
                }
                val age = profile?.age?.let { ", $it" } ?: ""
                Text(
                    text = (profile?.gender?.replace('_', ' ')?.lowercase() ?: "") + age +
                        (profile?.location?.let { " · $it" } ?: ""),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        StatRow(me)
        Spacer(Modifier.height(16.dp))

        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
            Column(Modifier.padding(16.dp)) {
                Text("Verification", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))
                verificationChips(me).forEach { chip ->
                    Text("• $chip", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        if (!profile?.bio.isNullOrBlank()) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(Modifier.padding(16.dp)) {
                    Text("About", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        profile?.bio ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
        }

        Button(
            onClick = onEdit,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentPink),
        ) {
            Text("Edit profile")
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth().height(52.dp)) {
            Text("Log out")
        }
    }
}

@Composable
private fun StatRow(me: UserMe) {
    val stats = me.stats
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        StatCell("${stats?.matches ?: 0}", "Matches")
        StatCell("${stats?.messages ?: 0}", "Messages")
        StatCell("${stats?.likesReceived ?: 0}", "Likes")
    }
}

@Composable
private fun StatCell(value: String, label: String) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(
            Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

private fun verificationChips(me: UserMe): List<String> {
    val v = me.verification ?: return emptyList()
    return buildList {
        if (v.ageDeclarationConfirmed) add("Age confirmed (18+)")
        if (v.termsAccepted) add("Terms & Privacy accepted")
        if (v.photoVerified) add("Photo verified")
        if (v.idVerified) add("ID verified")
    }
}