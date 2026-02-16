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
    }
}
