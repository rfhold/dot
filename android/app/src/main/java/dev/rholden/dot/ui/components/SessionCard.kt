package dev.rholden.dot.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.rholden.dot.data.TmuxPane
import dev.rholden.dot.data.TmuxSession
import dev.rholden.dot.data.TmuxWindow
import dev.rholden.dot.ui.theme.Green400
import dev.rholden.dot.ui.theme.Gray600
import dev.rholden.dot.ui.theme.Purple300

@Composable
fun SessionCard(
    session: TmuxSession,
    onClick: () -> Unit,
    onWindowClick: (windowIndex: Int) -> Unit = {},
    onPaneClick: (windowIndex: Int, paneIndex: Int) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier,
) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    val hasDetails = session.windowDetails.isNotEmpty()

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        // Session header row — always visible
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    if (hasDetails) expanded = !expanded else onClick()
                }
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

            // Session name
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

            // Expand/collapse chevron
            if (hasDetails) {
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp
                    else Icons.Default.KeyboardArrowDown,
                    contentDescription = if (expanded) "Collapse" else "Expand",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp),
                )
            }
        }

        // Expanded window/pane details
        AnimatedVisibility(
            visible = expanded && hasDetails,
            enter = expandVertically(),
            exit = shrinkVertically(),
        ) {
            Column {
                HorizontalDivider(
                    color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                    modifier = Modifier.padding(horizontal = 16.dp),
                )
                session.windowDetails.forEach { window ->
                    WindowRow(
                        window = window,
                        onClick = { onWindowClick(window.index) },
                        onPaneClick = { paneIndex -> onPaneClick(window.index, paneIndex) },
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun WindowRow(
    window: TmuxWindow,
    onClick: () -> Unit,
    onPaneClick: (paneIndex: Int) -> Unit,
) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Active indicator
            Box(
                modifier = Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(
                        if (window.active) Purple300
                        else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                    ),
            )

            Spacer(modifier = Modifier.width(10.dp))

            // Window index badge
            Text(
                text = "${window.index}",
                style = MaterialTheme.typography.labelSmall,
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.6f))
                    .padding(horizontal = 5.dp, vertical = 1.dp),
            )

            Spacer(modifier = Modifier.width(8.dp))

            // Window name
            Text(
                text = window.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (window.active) FontWeight.SemiBold else FontWeight.Normal,
                color = if (window.active) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(1f),
            )

            // Pane count
            if (window.panes.size > 1) {
                Text(
                    text = "${window.panes.size}p",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Pane rows (only shown if more than one pane)
        if (window.panes.size > 1) {
            window.panes.forEach { pane ->
                PaneRow(
                    pane = pane,
                    onClick = { onPaneClick(pane.index) },
                )
            }
        }
    }
}

@Composable
private fun PaneRow(
    pane: TmuxPane,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(start = 48.dp, end = 20.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // Active indicator
        Box(
            modifier = Modifier
                .size(5.dp)
                .clip(CircleShape)
                .background(
                    if (pane.active) Green400
                    else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                ),
        )

        // Pane index
        Text(
            text = "%${pane.index}",
            style = MaterialTheme.typography.labelSmall,
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        // Current command
        Text(
            text = pane.currentCommand,
            style = MaterialTheme.typography.bodySmall,
            fontFamily = FontFamily.Monospace,
            fontWeight = if (pane.active) FontWeight.SemiBold else FontWeight.Normal,
            color = if (pane.active) MaterialTheme.colorScheme.onSurface
            else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
    }
}
