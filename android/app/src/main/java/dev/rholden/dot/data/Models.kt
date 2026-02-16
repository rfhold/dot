package dev.rholden.dot.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TmuxPane(
    val index: Int,
    @SerialName("current_command")
    val currentCommand: String,
    val active: Boolean,
    val title: String,
)

@Serializable
data class TmuxWindow(
    val index: Int,
    val name: String,
    val active: Boolean,
    val panes: List<TmuxPane> = emptyList(),
)

@Serializable
data class TmuxSession(
    val name: String,
    val windows: Int,
    @SerialName("window_details")
    val windowDetails: List<TmuxWindow> = emptyList(),
    val attached: Boolean,
    @SerialName("last_activity")
    val lastActivity: String // ISO 8601 / RFC3339
)

@Serializable
data class Machine(
    val name: String,
    @SerialName("ssh_host")
    val sshHost: String,
    @SerialName("ssh_user")
    val sshUser: String,
    val sessions: List<TmuxSession>,
    @SerialName("last_seen")
    val lastSeen: String // ISO 8601 / RFC3339
)

@Serializable
data class SessionsResponse(
    val machines: List<Machine>
)
