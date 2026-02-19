package dev.rholden.dot.service

import androidx.compose.runtime.mutableStateListOf

/**
 * Data class representing an active Termux session launched by the app
 */
data class ActiveTermuxSession(
    val machineHost: String,
    val sessionName: String,
    val windowIndex: Int?,
    val launchTimestamp: Long,
    val processPid: Int? = null  // Will be null since we can't easily track PIDs from intent launches
)

/**
 * Singleton object to track active Termux sessions launched by the app.
 * This allows us to close sessions when the user navigates away from the app.
 */
object SessionTracker {
    private val activeSessions = mutableStateListOf<ActiveTermuxSession>()

    /**
     * Track a newly launched Termux session
     */
    fun trackSession(session: ActiveTermuxSession) {
        activeSessions.add(session)
    }

    /**
     * Get all currently tracked active sessions
     */
    fun getActiveSessions(): List<ActiveTermuxSession> {
        return activeSessions.toList()
    }

    /**
     * Clear all tracked sessions (typically called after closing them)
     */
    fun clearAllSessions() {
        activeSessions.clear()
    }

    /**
     * Remove a specific session from tracking
     */
    fun removeSession(machineHost: String, sessionName: String) {
        activeSessions.removeAll { session ->
            session.machineHost == machineHost && session.sessionName == sessionName
        }
    }

    /**
     * Get count of active sessions
     */
    fun getActiveSessionCount(): Int {
        return activeSessions.size
    }
}
