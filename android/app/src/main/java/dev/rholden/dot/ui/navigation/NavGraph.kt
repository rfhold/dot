package dev.rholden.dot.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import dev.rholden.dot.auth.AuthManager
import dev.rholden.dot.data.SessionRepository
import dev.rholden.dot.data.SettingsStore
import dev.rholden.dot.ui.screens.LoginScreen
import dev.rholden.dot.ui.screens.SessionListScreen
import dev.rholden.dot.ui.screens.SettingsScreen

object Routes {
    const val LOGIN = "login"
    const val SESSIONS = "sessions"
    const val SETTINGS = "settings"
}

@Composable
fun NavGraph(
    navController: NavHostController,
    authManager: AuthManager,
    settingsStore: SettingsStore,
    repository: SessionRepository,
    isConfigured: Boolean,
    skipAuth: Boolean,
    isAuthLoading: Boolean,
    authError: String?,
    onSignIn: () -> Unit,
) {
    val startDestination = if (authManager.isAuthorized || (skipAuth && isConfigured)) Routes.SESSIONS else Routes.LOGIN

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                isLoading = isAuthLoading,
                error = authError,
                isConfigured = isConfigured,
                onSignIn = onSignIn,
                onNavigateToSettings = {
                    navController.navigate(Routes.SETTINGS)
                },
            )
        }

        composable(Routes.SESSIONS) {
            SessionListScreen(
                repository = repository,
                settingsStore = settingsStore,
                onNavigateToSettings = {
                    navController.navigate(Routes.SETTINGS)
                },
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                settingsStore = settingsStore,
                authManager = authManager,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onSignOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }
    }
}
