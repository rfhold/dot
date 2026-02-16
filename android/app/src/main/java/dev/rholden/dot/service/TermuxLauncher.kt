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
        paneIndex: Int? = null,
    ) {
        // Build the tmux command: attach to session, optionally select window/pane.
        val tmuxCmd = buildString {
            append("tmux attach -t $sessionName")
            if (windowIndex != null) {
                append(" \\; select-window -t $windowIndex")
                if (paneIndex != null) {
                    append(" \\; select-pane -t $paneIndex")
                    append(" \\; resize-pane -Z")
                }
            }
        }

        val label = buildString {
            append("SSH to $sshHost - tmux $sessionName")
            if (windowIndex != null) {
                append(":$windowIndex")
                if (paneIndex != null) {
                    append(".$paneIndex")
                }
            }
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
    }
}
