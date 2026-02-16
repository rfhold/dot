package dev.rholden.dot.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val AuraDarkColorScheme = darkColorScheme(
    primary = Purple300,
    secondary = Purple400,
    tertiary = Purple100,
    background = Dark900,
    surface = Dark900,
    surfaceVariant = Dark800,
    onPrimary = Dark900,
    onSecondary = Dark900,
    onTertiary = Dark900,
    onBackground = Gray300,
    onSurface = Gray300,
    onSurfaceVariant = Gray400,
    error = Red400,
    outline = Dark700,
)

@Composable
fun TmuxViewerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AuraDarkColorScheme,
        content = content,
    )
}
