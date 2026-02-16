package dev.rholden.dot.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsStore(private val context: Context) {

    companion object {
        private val KEY_SERVER_URL = stringPreferencesKey("server_url")
        private val KEY_AUTHENTIK_DOMAIN = stringPreferencesKey("authentik_domain")
        private val KEY_AUTHENTIK_SLUG = stringPreferencesKey("authentik_slug")
        private val KEY_OIDC_CLIENT_ID = stringPreferencesKey("oidc_client_id")
        private val KEY_DEFAULT_SSH_USER = stringPreferencesKey("default_ssh_user")
        private val KEY_AUTO_REFRESH_INTERVAL = intPreferencesKey("auto_refresh_interval")
        private val KEY_SKIP_AUTH = booleanPreferencesKey("skip_auth")
    }

    val serverUrl: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_SERVER_URL] ?: ""
    }

    val authentikDomain: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTHENTIK_DOMAIN] ?: ""
    }

    val authentikSlug: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTHENTIK_SLUG] ?: ""
    }

    val oidcClientId: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_OIDC_CLIENT_ID] ?: ""
    }

    val defaultSshUser: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_DEFAULT_SSH_USER] ?: ""
    }

    val autoRefreshInterval: Flow<Int> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTO_REFRESH_INTERVAL] ?: 30
    }

    val skipAuth: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_SKIP_AUTH] ?: false
    }

    suspend fun updateServerUrl(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_SERVER_URL] = value }
    }

    suspend fun updateAuthentikDomain(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_AUTHENTIK_DOMAIN] = value }
    }

    suspend fun updateAuthentikSlug(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_AUTHENTIK_SLUG] = value }
    }

    suspend fun updateOidcClientId(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_OIDC_CLIENT_ID] = value }
    }

    suspend fun updateDefaultSshUser(value: String) {
        context.dataStore.edit { prefs -> prefs[KEY_DEFAULT_SSH_USER] = value }
    }

    suspend fun updateAutoRefreshInterval(value: Int) {
        context.dataStore.edit { prefs -> prefs[KEY_AUTO_REFRESH_INTERVAL] = value }
    }

    suspend fun updateSkipAuth(value: Boolean) {
        context.dataStore.edit { prefs -> prefs[KEY_SKIP_AUTH] = value }
    }
}
