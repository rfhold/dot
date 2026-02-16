package dev.rholden.dot.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.rholden.dot.data.Machine
import java.time.Duration
import java.time.Instant
import java.time.format.DateTimeParseException

@Composable
fun MachineHeader(machine: Machine, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = machine.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = machine.sshHost,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Text(
            text = "Last seen ${formatRelativeTime(machine.lastSeen)}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}

fun formatRelativeTime(iso8601: String): String {
    return try {
        val instant = Instant.parse(iso8601)
        val now = Instant.now()
        val duration = Duration.between(instant, now)

        when {
            duration.isNegative -> "just now"
            duration.seconds < 60 -> "${duration.seconds}s ago"
            duration.toMinutes() < 60 -> "${duration.toMinutes()}m ago"
            duration.toHours() < 24 -> "${duration.toHours()}h ago"
            duration.toDays() < 30 -> "${duration.toDays()}d ago"
            else -> "${duration.toDays() / 30}mo ago"
        }
    } catch (_: DateTimeParseException) {
        "unknown"
    }
}
