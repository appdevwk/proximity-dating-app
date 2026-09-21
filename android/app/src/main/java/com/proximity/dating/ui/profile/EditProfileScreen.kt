package com.proximity.dating.ui.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.proximity.dating.network.ProfileUpdate
import com.proximity.dating.network.PreferencesUpdate
import com.proximity.dating.ui.components.ErrorState
import com.proximity.dating.ui.components.FullScreenLoading
import com.proximity.dating.ui.theme.AccentPink

private val GENDERS = listOf("MALE", "FEMALE", "NON_BINARY", "OTHER")

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    viewModel: ProfileViewModel,
    onSaved: () -> Unit,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    val saveState by viewModel.saveState.collectAsState()

    when (val s = state) {
        is ProfileUiState.Loading -> FullScreenLoading()
        is ProfileUiState.Error -> ErrorState(s.message, onRetry = { viewModel.load() })
        is ProfileUiState.Loaded -> Editor(
            me = s.me,
            saveState = saveState,
            onSave = { profile, preferences -> viewModel.save(profile, preferences) { } },
            onUploadPhoto = { bytes, mime -> viewModel.uploadPhoto(bytes, mime) { viewModel.load() } },
            onSaved = onSaved,
            onBack = onBack,
        )
    }
}

@Composable
private fun Editor(
    me: com.proximity.dating.network.UserMe,
    saveState: SaveState,
    onSave: (ProfileUpdate, PreferencesUpdate) -> Unit,
    onUploadPhoto: (ByteArray, String) -> Unit,
    onSaved: () -> Unit,
    onBack: () -> Unit,
) {
    var displayName by rememberSaveable { mutableStateOf(me.profile?.displayName ?: me.user.name ?: "") }
    var bio by rememberSaveable { mutableStateOf(me.profile?.bio ?: "") }
    var location by rememberSaveable { mutableStateOf(me.profile?.location ?: "") }
    var gender by rememberSaveable { mutableStateOf(me.profile?.gender ?: "OTHER") }
    var interestedIn by rememberSaveable {
        mutableStateOf(me.profile?.interestedIn ?: listOf("MALE", "FEMALE"))
    }
    var minAge by rememberSaveable { mutableIntStateOf(me.preferences?.minAge ?: 18) }
    var maxAge by rememberSaveable { mutableIntStateOf(me.preferences?.maxAge ?: 100) }
    var maxDistance by rememberSaveable { mutableFloatStateOf((me.preferences?.maxDistance ?: 50).toFloat()) }

    var uploadError by rememberSaveable { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    val photoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            runCatching {
                val resolver = context.contentResolver
                val type = resolver.getType(uri)
                    ?: context.contentResolver.getType(uri) ?: "image/jpeg"
                val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
                if (bytes.isNullOrEmpty()) throw IllegalStateException("Empty file")
                bytes to type
            }.onSuccess { (bytes, type) ->
                uploadError = null
                onUploadPhoto(bytes, type)
            }.onFailure { t ->
                uploadError = t.message ?: "Couldn't read photo"
            }
        }
    }

    LaunchedEffect(saveState.saved) {
        if (saveState.saved) onSaved()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit profile") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            OutlinedTextField(
                value = displayName,
                onValueChange = { displayName = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Display name") },
                singleLine = true,
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("About you") },
                maxLines = 5,
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Location (city, neighborhood)") },
                singleLine = true,
            )

            Spacer(Modifier.height(20.dp))
            Text("I am", style = MaterialTheme.typography.titleSmall, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            Row {
                GENDERS.forEach { g ->
                    FilterChip(
                        selected = gender == g,
                        onClick = { gender = g },
                        label = { Text(g.replace('_', ' ').lowercase()) },
                    )
                    Spacer(Modifier.height(8.dp))
                }
            }

            Spacer(Modifier.height(16.dp))
            Text("I'm interested in", style = MaterialTheme.typography.titleSmall, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            GENDERS.forEach { g ->
                val checked = g in interestedIn
                FilterChip(
                    selected = checked,
                    onClick = {
                        interestedIn = if (checked) {
                            interestedIn.filterNot { it == g }
                        } else {
                            interestedIn + g
                        }.ifEmpty { listOf(g) }
                    },
                    label = { Text(g.replace('_', ' ').lowercase()) },
                )
                Spacer(Modifier.height(4.dp))
            }

            Spacer(Modifier.height(20.dp))
            Text("Age range", style = MaterialTheme.typography.titleSmall, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
            Slider(value = minAge.toFloat(), onValueChange = {
                minAge = it.toInt().coerceIn(18, maxAge)
            }, valueRange = 18f..100f)
            Text("Min: $minAge", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Slider(value = maxAge.toFloat(), onValueChange = {
                maxAge = it.toInt().coerceIn(minAge, 100)
            }, valueRange = 18f..100f)
            Text("Max: $maxAge", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Spacer(Modifier.height(8.dp))
            Text("Distance", style = MaterialTheme.typography.titleSmall, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
            Slider(value = maxDistance, onValueChange = { maxDistance = it }, valueRange = 1f..500f)
            Text("Within ${maxDistance.toInt()} miles", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Spacer(Modifier.height(20.dp))
            OutlinedButton(
                onClick = { photoPicker.launch("image/*") },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Change profile photo")
            }
            uploadError?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            saveState.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = {
                    val profile = ProfileUpdate(
                        displayName = displayName.trim(),
                        bio = bio.trim().ifBlank { null },
                        gender = gender,
                        interestedIn = interestedIn,
                        location = location.trim().ifBlank { null },
                    )
                    val preferences = PreferencesUpdate(
                        minAge = minAge,
                        maxAge = maxAge,
                        maxDistance = maxDistance.toInt(),
                    )
                    onSave(profile, preferences)
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = displayName.isNotBlank() && interestedIn.isNotEmpty() && !saveState.saving,
            ) {
                if (saveState.saving) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                } else {
                    Text("Save changes")
                }
            }
        }
    }
}