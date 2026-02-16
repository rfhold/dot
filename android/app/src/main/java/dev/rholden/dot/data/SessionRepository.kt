package dev.rholden.dot.data

import android.content.Context
import dev.rholden.dot.api.TmuxApiClient
import dev.rholden.dot.auth.AuthManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.IOException
import kotlin.coroutines.resume

sealed class UiState {
    data object Loading : UiState()
    data class Success(
        val machines: List<Machine>,
        val isRefreshing: Boolean = false,
    ) : UiState()
    data class Error(
        val message: String,
        val previousMachines: List<Machine>? = null,
    ) : UiState()
}

class SessionRepository(
    private val authManager: AuthManager,
    private val settingsStore: SettingsStore,
) {

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    private var apiClient: TmuxApiClient? = null
    private var lastServerUrl: String? = null

    private fun getClient(serverUrl: String): TmuxApiClient {
        if (serverUrl != lastServerUrl || apiClient == null) {
            apiClient = TmuxApiClient(serverUrl)
            lastServerUrl = serverUrl
        }
        return apiClient!!
    }

    /** Cached machines from the last successful fetch. */
    private val currentMachines: List<Machine>?
        get() = when (val s = _state.value) {
            is UiState.Success -> s.machines
            is UiState.Error -> s.previousMachines
            is UiState.Loading -> null
        }

    suspend fun refresh(context: Context) {
        val existing = currentMachines

        // Only show full-screen loading on the very first load
        if (existing == null) {
            _state.value = UiState.Loading
        } else {
            _state.value = UiState.Success(existing, isRefreshing = true)
        }

        val serverUrl = settingsStore.serverUrl.first()
        if (serverUrl.isBlank()) {
            _state.value = UiState.Error("Server URL not configured", existing)
            return
        }

        val skipAuth = settingsStore.skipAuth.first()

        try {
            val token: String? = if (skipAuth) {
                null
            } else {
                val t = withContext(Dispatchers.IO) {
                    suspendCancellableCoroutine { cont ->
                        authManager.performWithFreshToken(context) { accessToken ->
                            cont.resume(accessToken)
                        }
                    }
                }
                if (t.isBlank()) {
                    _state.value = UiState.Error(
                        "Authentication required — please sign in again",
                        existing,
                    )
                    return
                }
                t
            }

            val client = getClient(serverUrl)
            val result = client.getSessions(token)

            result.fold(
                onSuccess = { response ->
                    _state.value = UiState.Success(response.machines)
                },
                onFailure = { error ->
                    val message = when {
                        error is IOException && error.message?.contains("401") == true ->
                            "Authentication expired — please sign in again"
                        else ->
                            error.message ?: "Unknown error"
                    }
                    // Keep showing existing data with an error overlay
                    _state.value = UiState.Error(message, existing)
                },
            )
        } catch (e: Exception) {
            _state.value = UiState.Error(e.message ?: "Unknown error", existing)
        }
    }
}
