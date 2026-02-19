package dev.rholden.dot.service

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

object TermuxLauncher {

    fun isTermuxInstalled(context: Context): Boolean {
        return try {
            context.packageManager.getPackageInfo("com.termux", 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    fun launchSshTmuxSession(
        context: Context,
        sshHost: String,
        sshUser: String,
        sessionName: String,
        windowIndex: Int? = null,
    ) {
        val tmuxTarget = if (windowIndex != null) "$sessionName:$windowIndex" else sessionName
        val tmuxCmd = "tmux attach -t $tmuxTarget"
        val label = if (windowIndex != null) {
            "SSH to $sshHost - tmux $sessionName:$windowIndex"
        } else {
            "SSH to $sshHost - tmux $sessionName"
        }

        val intent = Intent().apply {
            setClassName("com.termux", "com.termux.app.RunCommandService")
            action = "com.termux.RUN_COMMAND"
            putExtra(
                "com.termux.RUN_COMMAND_PATH",
                "/data/data/com.termux/files/usr/bin/ssh",
            )
            putExtra(
                "com.termux.RUN_COMMAND_ARGUMENTS", arrayOf(
                    "$sshUser@$sshHost",
                    "-t",
                    tmuxCmd,
                )
            )
            putExtra(
                "com.termux.RUN_COMMAND_WORKDIR",
                "/data/data/com.termux/files/home",
            )
            putExtra("com.termux.RUN_COMMAND_BACKGROUND", false)
            putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")
            putExtra(
                "com.termux.RUN_COMMAND_COMMAND_LABEL",
                label,
            )
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }

        // Track this session so we can close it later
        SessionTracker.trackSession(
            ActiveTermuxSession(
                machineHost = sshHost,
                sessionName = sessionName,
                windowIndex = windowIndex,
                launchTimestamp = System.currentTimeMillis(),
                processPid = null  // Can't easily get PID from intent launch
            )
        )
    }

    /**
     * Close all tracked Termux sessions by killing SSH processes.
     * This is called when the user navigates away from the app via back button.
     *
     * Note: This kills ALL SSH processes in Termux, not just ones launched by this app.
     * This is acceptable when the app is closing anyway.
     */
    fun closeAllTrackedSessions(context: Context) {
        val sessionCount = SessionTracker.getActiveSessionCount()
        
        // Only send kill command if we have tracked sessions
        if (sessionCount > 0) {
            val intent = Intent().apply {
                setClassName("com.termux", "com.termux.app.RunCommandService")
                action = "com.termux.RUN_COMMAND"
                putExtra(
                    "com.termux.RUN_COMMAND_PATH",
                    "/data/data/com.termux/files/usr/bin/pkill"
                )
                putExtra(
                    "com.termux.RUN_COMMAND_ARGUMENTS",
                    arrayOf("-9", "ssh")
                )
                putExtra("com.termux.RUN_COMMAND_BACKGROUND", true)
            }

            try {
                context.startService(intent)
            } catch (e: Exception) {
                // Silently fail if Termux is not available or permission denied
                // This is acceptable as the user is leaving the app anyway
            }

            // Clear tracked sessions
            SessionTracker.clearAllSessions()
        }
    }
}
