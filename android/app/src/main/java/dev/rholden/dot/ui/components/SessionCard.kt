package dev.rholden.dot.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.rholden.dot.data.TmuxSession
import dev.rholden.dot.data.TmuxWindow
import dev.rholden.dot.ui.theme.Green400
import dev.rholden.dot.ui.theme.Gray600
import dev.rholden.dot.ui.theme.Purple300

@Composable
fun SessionCard(
    session: TmuxSession,
    isExpanded: Boolean,
    onSessionTap: () -> Unit,
    onWindowTap: (TmuxWindow) -> Unit,
    modifier: Modifier = Modifier,
) {
    val hasMultipleWindows = session.windowDetails.size > 1
    val chevronRotation by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        label = "chevronRotation",
    )

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column {
            // Header row (always visible)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onSessionTap)
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Status indicator dot
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(if (session.attached) Green400 else Gray600),
                )

                Spacer(modifier = Modifier.width(12.dp))

                // Session name + relative time
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = session.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = formatRelativeTime(session.lastActivity),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                // Window count and status
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${session.windows}w",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = if (session.attached) "attached" else "detached",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (session.attached) Green400 else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                // Chevron for multi-window sessions
                if (hasMultipleWindows) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        modifier = Modifier
                            .size(24.dp)
                            .rotate(chevronRotation),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Expandable window list
            AnimatedVisibility(
                visible = isExpanded && hasMultipleWindows,
                enter = expandVertically(),
                exit = shrinkVertically(),
            ) {
                Column {
                    HorizontalDivider(
                        color = MaterialTheme.colorScheme.outlineVariant,
                        thickness = 0.5.dp,
                        modifier = Modifier.padding(horizontal = 16.dp),
                    )

                    session.windowDetails.forEachIndexed { listIdx, window ->
                        if (listIdx > 0) {
                            HorizontalDivider(
                                color = MaterialTheme.colorScheme.outlineVariant,
                                thickness = 0.5.dp,
                                modifier = Modifier.padding(horizontal = 32.dp),
                            )
                        }

                        WindowRow(
                            window = window,
                            onClick = { onWindowTap(window) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WindowRow(
    window: TmuxWindow,
    onClick: () -> Unit,
) {
    val activeCommand = window.panes.firstOrNull { it.active }?.currentCommand

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Window index badge
        Box(
            modifier = Modifier
                .size(22.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Purple300.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "${window.index}",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Purple300,
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Window name + active command
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = window.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            if (!activeCommand.isNullOrBlank()) {
                Text(
                    text = activeCommand,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                )
            }
        }

        // Active indicator dot
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(
                    if (window.active) Green400 else androidx.compose.ui.graphics.Color.Transparent,
                ),
        )
    }
}
