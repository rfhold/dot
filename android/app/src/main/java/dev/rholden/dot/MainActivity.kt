package dev.rholden.dot

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.navigation.compose.rememberNavController
import dev.rholden.dot.auth.AuthManager
import dev.rholden.dot.data.SessionRepository
import dev.rholden.dot.data.SettingsStore
import dev.rholden.dot.ui.navigation.NavGraph
import dev.rholden.dot.ui.navigation.Routes
import dev.rholden.dot.ui.theme.PrismTheme
import kotlinx.coroutines.runBlocking

class MainActivity : ComponentActivity() {

    private lateinit var authManager: AuthManager
    private lateinit var settingsStore: SettingsStore
    private lateinit var repository: SessionRepository
    private lateinit var authLauncher: ActivityResultLauncher<android.content.Intent>

    private var isAuthLoading by mutableStateOf(false)
    private var authError by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        settingsStore = SettingsStore(applicationContext)
        authManager = AuthManager(applicationContext)
        repository = SessionRepository(authManager, settingsStore)

        authLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult(),
        ) { result ->
            val data = result.data
            if (data != null) {
                authManager.handleAuthResponse(data, this@MainActivity) { success, error ->
                    runOnUiThread {
                        isAuthLoading = false
                        if (success) {
                            authError = null
                        } else {
                            authError = error ?: "Authentication failed"
                        }
                    }
                }
            } else {
                isAuthLoading = false
                authError = "Authentication was cancelled"
            }
        }

        setContent {
            PrismTheme {
                val navController = rememberNavController()

                val serverUrl by settingsStore.serverUrl.collectAsState(initial = "")
                val authentikDomain by settingsStore.authentikDomain.collectAsState(initial = "")
                val oidcClientId by settingsStore.oidcClientId.collectAsState(initial = "")
                val authentikSlug by settingsStore.authentikSlug.collectAsState(initial = "")
                val skipAuth by settingsStore.skipAuth.collectAsState(initial = false)

                val isConfigured = if (skipAuth) {
                    serverUrl.isNotBlank()
                } else {
                    serverUrl.isNotBlank()
                            && authentikDomain.isNotBlank()
                            && oidcClientId.isNotBlank()
                            && authentikSlug.isNotBlank()
                }

                // Navigate to sessions when auth succeeds or skip-auth is enabled
                if ((authManager.isAuthorized || skipAuth) && isConfigured && authError == null && !isAuthLoading) {
                    LaunchedEffect(Unit) {
                        if (navController.currentDestination?.route == Routes.LOGIN) {
                            navController.navigate(Routes.SESSIONS) {
                                popUpTo(Routes.LOGIN) { inclusive = true }
                            }
                        }
                    }
                }

                NavGraph(
                    navController = navController,
                    authManager = authManager,
                    settingsStore = settingsStore,
                    repository = repository,
                    isConfigured = isConfigured,
                    skipAuth = skipAuth,
                    isAuthLoading = isAuthLoading,
                    authError = authError,
                    onSignIn = { startOidcFlow(authentikDomain, authentikSlug, oidcClientId) },
                )
            }
        }
    }

    private fun startOidcFlow(domain: String, slug: String, clientId: String) {
        isAuthLoading = true
        authError = null

        Thread {
            try {
                runBlocking {
                    authManager.discoverConfiguration(domain, slug)
                }
                val authIntent = authManager.buildAuthIntent(clientId)
                authLauncher.launch(authIntent)
            } catch (e: Exception) {
                runOnUiThread {
                    isAuthLoading = false
                    authError = "Discovery failed: ${e.message}"
                }
            }
        }.start()
    }
}
