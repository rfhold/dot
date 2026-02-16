package dev.rholden.dot.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import dev.rholden.dot.api.TmuxApiClient
import dev.rholden.dot.auth.AuthManager
import dev.rholden.dot.data.SettingsStore
import dev.rholden.dot.ui.theme.Green400
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    settingsStore: SettingsStore,
    authManager: AuthManager,
    onNavigateBack: () -> Unit,
    onSignOut: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // Read persisted values
    val persistedServerUrl by settingsStore.serverUrl.collectAsState(initial = "")
    val persistedAuthentikDomain by settingsStore.authentikDomain.collectAsState(initial = "")
    val persistedAuthentikSlug by settingsStore.authentikSlug.collectAsState(initial = "")
    val persistedOidcClientId by settingsStore.oidcClientId.collectAsState(initial = "")
    val persistedDefaultSshUser by settingsStore.defaultSshUser.collectAsState(initial = "")
    val autoRefreshInterval by settingsStore.autoRefreshInterval.collectAsState(initial = 30)
    val skipAuth by settingsStore.skipAuth.collectAsState(initial = false)

    // Local text field state
    var serverUrl by remember { mutableStateOf("") }
    var authentikDomain by remember { mutableStateOf("") }
    var authentikSlug by remember { mutableStateOf("") }
    var oidcClientId by remember { mutableStateOf("") }
    var defaultSshUser by remember { mutableStateOf("") }

    // Sync local state from persisted values
    LaunchedEffect(persistedServerUrl) { serverUrl = persistedServerUrl }
    LaunchedEffect(persistedAuthentikDomain) { authentikDomain = persistedAuthentikDomain }
    LaunchedEffect(persistedAuthentikSlug) { authentikSlug = persistedAuthentikSlug }
    LaunchedEffect(persistedOidcClientId) { oidcClientId = persistedOidcClientId }
    LaunchedEffect(persistedDefaultSshUser) { defaultSshUser = persistedDefaultSshUser }

    var healthStatus by remember { mutableStateOf<String?>(null) }
    var isTestingConnection by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Settings",
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
        ) {
            // --- Server Configuration ---
            SectionHeader("Server Configuration")

            OutlinedTextField(
                value = serverUrl,
                onValueChange = { serverUrl = it; scope.launch { settingsStore.updateServerUrl(it) } },
                label = { Text("Server URL") },
                placeholder = { Text("https://dot.example.com") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = {
                        scope.launch {
                            isTestingConnection = true
                            healthStatus = null
                            val result = TmuxApiClient.checkHealth(serverUrl)
                            healthStatus = result.fold(
                                onSuccess = { "Connected successfully" },
                                onFailure = { "Failed: ${it.message}" },
                            )
                            isTestingConnection = false
                        }
                    },
                    enabled = serverUrl.isNotBlank() && !isTestingConnection,
                ) {
                    if (isTestingConnection) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .height(16.dp)
                                .width(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
                        )
                    } else {
                        Text("Test Connection")
                    }
                }

                if (healthStatus != null) {
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = healthStatus!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (healthStatus!!.startsWith("Connected"))
                            Green400
                        else
                            MaterialTheme.colorScheme.error,
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline)
            Spacer(modifier = Modifier.height(16.dp))

            // --- Authentication ---
            SectionHeader("Authentication")

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Skip Authentication",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = "Connect without OIDC (dev mode)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(
                    checked = skipAuth,
                    onCheckedChange = { scope.launch { settingsStore.updateSkipAuth(it) } },
                )
            }

            if (!skipAuth) {
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = authentikDomain,
                    onValueChange = { authentikDomain = it; scope.launch { settingsStore.updateAuthentikDomain(it) } },
                    label = { Text("Authentik Domain") },
                    placeholder = { Text("auth.example.com") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = authentikSlug,
                    onValueChange = { authentikSlug = it; scope.launch { settingsStore.updateAuthentikSlug(it) } },
                    label = { Text("Application Slug") },
                    placeholder = { Text("my-app") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = oidcClientId,
                    onValueChange = { oidcClientId = it; scope.launch { settingsStore.updateOidcClientId(it) } },
                    label = { Text("Client ID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(12.dp))

                if (authManager.isAuthorized) {
                    val email = authManager.currentEmail
                    Text(
                        text = "Signed in as: ${email ?: "unknown"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Green400,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(onClick = {
                        authManager.logout()
                        onSignOut()
                    }) {
                        Text("Sign Out")
                    }
                } else {
                    Text(
                        text = "Not signed in",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline)
            Spacer(modifier = Modifier.height(16.dp))

            // --- SSH Defaults ---
            SectionHeader("SSH Defaults")

            OutlinedTextField(
                value = defaultSshUser,
                onValueChange = { defaultSshUser = it; scope.launch { settingsStore.updateDefaultSshUser(it) } },
                label = { Text("Default SSH User") },
                placeholder = { Text("Override SSH user (optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline)
            Spacer(modifier = Modifier.height(16.dp))

            // --- Refresh ---
            SectionHeader("Refresh")

            Text(
                text = "Auto-refresh interval: ${autoRefreshInterval}s",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )

            Slider(
                value = autoRefreshInterval.toFloat(),
                onValueChange = { newValue ->
                    scope.launch {
                        settingsStore.updateAutoRefreshInterval(newValue.roundToInt())
                    }
                },
                valueRange = 5f..120f,
                steps = 22,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(bottom = 12.dp),
    )
}
