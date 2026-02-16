package dev.rholden.dot.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import net.openid.appauth.AuthState
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationRequest
import net.openid.appauth.AuthorizationResponse
import net.openid.appauth.AuthorizationService
import net.openid.appauth.AuthorizationServiceConfiguration
import net.openid.appauth.ResponseTypeValues
import kotlin.coroutines.resume

class AuthManager(
    private val context: Context,
) {

    companion object {
        private const val PREFS_FILE = "auth_prefs"
        private const val KEY_AUTH_STATE = "auth_state"
        private const val REDIRECT_URI = "dev.rholden.dot://oauth2/callback"
    }

    private val json = Json { ignoreUnknownKeys = true }

    private var authState: AuthState = restoreAuthState()
    private var serviceConfig: AuthorizationServiceConfiguration? = null

    val isAuthorized: Boolean
        get() = authState.isAuthorized

    val currentEmail: String?
        get() {
            val idToken = authState.idToken ?: return null
            return try {
                val parts = idToken.split(".")
                if (parts.size < 2) return null
                val payload = parts[1]
                // Base64url decode the payload
                val decoded = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
                val jsonStr = String(decoded, Charsets.UTF_8)
                val claims = json.decodeFromString<JsonObject>(jsonStr)
                claims["email"]?.jsonPrimitive?.content
            } catch (_: Exception) {
                null
            }
        }

    suspend fun discoverConfiguration(domain: String, slug: String) {
        val issuerUri = Uri.parse("https://$domain/application/o/$slug/")
        serviceConfig = withContext(Dispatchers.IO) {
            suspendCancellableCoroutine { cont ->
                AuthorizationServiceConfiguration.fetchFromIssuer(issuerUri) { config, ex ->
                    if (config != null) {
                        cont.resume(config)
                    } else {
                        cont.resume(null)
                    }
                }
            }
        } ?: throw IllegalStateException(
            "Failed to discover OIDC configuration from $issuerUri"
        )
    }

    fun buildAuthIntent(clientId: String): Intent {
        val config = serviceConfig
            ?: throw IllegalStateException("Must call discoverConfiguration() first")

        val authRequest = AuthorizationRequest.Builder(
            config,
            clientId,
            ResponseTypeValues.CODE,
            Uri.parse(REDIRECT_URI),
        )
            .setScopes("openid", "profile", "email", "offline_access")
            .build()

        val authService = AuthorizationService(context)
        return authService.getAuthorizationRequestIntent(authRequest)
    }

    fun handleAuthResponse(
        intent: Intent,
        context: Context,
        onComplete: (Boolean, String?) -> Unit,
    ) {
        val response = AuthorizationResponse.fromIntent(intent)
        val exception = AuthorizationException.fromIntent(intent)

        authState.update(response, exception)

        if (response != null) {
            val authService = AuthorizationService(context)
            authService.performTokenRequest(
                response.createTokenExchangeRequest(),
            ) { tokenResponse, tokenEx ->
                authState.update(tokenResponse, tokenEx)
                persistAuthState()
                if (tokenResponse != null) {
                    onComplete(true, null)
                } else {
                    onComplete(false, tokenEx?.errorDescription ?: "Token exchange failed")
                }
                authService.dispose()
            }
        } else {
            persistAuthState()
            onComplete(false, exception?.errorDescription ?: "Authorization failed")
        }
    }

    fun performWithFreshToken(
        context: Context,
        action: (String) -> Unit,
    ) {
        val authService = AuthorizationService(context)
        authState.performActionWithFreshTokens(authService) { accessToken, _, ex ->
            if (accessToken != null) {
                action(accessToken)
            } else {
                action("")
            }
            authService.dispose()
        }
    }

    fun logout() {
        authState = AuthState()
        val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    private fun persistAuthState() {
        val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_AUTH_STATE, authState.jsonSerializeString())
            .apply()
    }

    private fun restoreAuthState(): AuthState {
        val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        val stateJson = prefs.getString(KEY_AUTH_STATE, null)
        return if (stateJson != null) {
            try {
                AuthState.jsonDeserialize(stateJson)
            } catch (_: Exception) {
                AuthState()
            }
        } else {
            AuthState()
        }
    }
}
