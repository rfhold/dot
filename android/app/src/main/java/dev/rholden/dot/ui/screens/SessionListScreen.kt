package dev.rholden.dot.ui.screens

import android.widget.Toast
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rholden.dot.data.Machine
import dev.rholden.dot.data.SessionRepository
import dev.rholden.dot.data.SettingsStore
import dev.rholden.dot.data.UiState
import dev.rholden.dot.service.TermuxLauncher
import dev.rholden.dot.ui.components.MachineHeader
import dev.rholden.dot.ui.components.SessionCard
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Extracts all unique process names from panes across all machines.
 */
private fun extractProcesses(machines: List<Machine>): List<String> {
    return machines
        .flatMap { it.sessions }
        .flatMap { it.windowDetails }
        .flatMap { it.panes }
        .map { it.currentCommand }
        .distinct()
        .sorted()
}

/**
 * Filters the machine list to only include sessions/windows/panes
 * that match the selected process. Preserves the hierarchy.
 */
private fun filterByProcess(machines: List<Machine>, process: String): List<Machine> {
    return machines.mapNotNull { machine ->
        val filteredSessions = machine.sessions.mapNotNull { session ->
            val filteredWindows = session.windowDetails.mapNotNull { window ->
                val matchingPanes = window.panes.filter { it.currentCommand == process }
                if (matchingPanes.isNotEmpty()) {
                    window.copy(panes = matchingPanes)
                } else {
                    null
                }
            }
            if (filteredWindows.isNotEmpty()) {
                session.copy(
                    windowDetails = filteredWindows,
                    windows = filteredWindows.size,
                )
            } else {
                null
            }
        }
        if (filteredSessions.isNotEmpty()) {
            machine.copy(sessions = filteredSessions)
        } else {
            null
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionListScreen(
    repository: SessionRepository,
    settingsStore: SettingsStore,
    onNavigateToSettings: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val uiState by repository.state.collectAsState()
    val autoRefreshInterval by settingsStore.autoRefreshInterval.collectAsState(initial = 30)
    val snackbarHostState = remember { SnackbarHostState() }
    var selectedProcess by rememberSaveable { mutableStateOf<String?>(null) }

    // Initial load
    LaunchedEffect(Unit) {
        repository.refresh(context)
    }

    // Auto-refresh timer
    LaunchedEffect(autoRefreshInterval) {
        while (isActive) {
            delay(autoRefreshInterval.toLong() * 1000)
            repository.refresh(context)
        }
    }

    // Show snackbar for errors that have previous data (non-blocking errors)
    LaunchedEffect(uiState) {
        val state = uiState
        if (state is UiState.Error && state.previousMachines != null) {
            val result = snackbarHostState.showSnackbar(
                message = state.message,
                actionLabel = "Retry",
                duration = SnackbarDuration.Short,
            )
            if (result == SnackbarResult.ActionPerformed) {
                repository.refresh(context)
            }
        }
    }

    fun doRefresh() {
        scope.launch {
            repository.refresh(context)
        }
    }

    fun onSessionTap(
        machine: Machine,
        sessionName: String,
        windowIndex: Int? = null,
        paneIndex: Int? = null,
    ) {
        if (!TermuxLauncher.isTermuxInstalled(context)) {
            Toast.makeText(context, "Termux is not installed", Toast.LENGTH_LONG).show()
            return
        }
        TermuxLauncher.launchSshTmuxSession(
            context = context,
            sshHost = machine.sshHost,
            sshUser = machine.sshUser,
            sessionName = sessionName,
            windowIndex = windowIndex,
            paneIndex = paneIndex,
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Tmux Sessions",
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
                actions = {
                    IconButton(onClick = { doRefresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { paddingValues ->
        // Determine what to render based on state
        val rawMachines: List<Machine>? = when (val state = uiState) {
            is UiState.Loading -> null
            is UiState.Success -> state.machines
            is UiState.Error -> state.previousMachines
        }
        val isRefreshing = uiState is UiState.Success && (uiState as UiState.Success).isRefreshing

        // Derive available processes and filtered machines
        val processes by remember(rawMachines) {
            derivedStateOf { rawMachines?.let { extractProcesses(it) } ?: emptyList() }
        }
        // Clear selected process if it no longer exists in the data
        if (selectedProcess != null && selectedProcess !in processes) {
            selectedProcess = null
        }
        val machines = remember(rawMachines, selectedProcess) {
            val m = rawMachines ?: return@remember null
            val proc = selectedProcess
            if (proc != null) filterByProcess(m, proc) else m
        }

        when {
            // First load: no data yet
            rawMachines == null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            // Full-screen error with no previous data to show
            uiState is UiState.Error && rawMachines.isEmpty() -> {
                val errorState = uiState as UiState.Error
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = errorState.message,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.error,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 32.dp),
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { doRefresh() }) {
                            Text("Retry")
                        }
                    }
                }
            }

            // Empty state (no sessions at all, or filter yields nothing)
            rawMachines.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "No sessions found",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { doRefresh() }) {
                            Text("Refresh")
                        }
                    }
                }
            }

            // Normal session list with pull-to-refresh
            else -> {
                PullToRefreshBox(
                    isRefreshing = isRefreshing,
                    onRefresh = { doRefresh() },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                ) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Process filter chips
                        if (processes.isNotEmpty()) {
                            ProcessFilterChips(
                                processes = processes,
                                selectedProcess = selectedProcess,
                                onProcessSelected = { process ->
                                    selectedProcess = if (selectedProcess == process) null else process
                                },
                            )
                        }

                        // Session list
                        val displayMachines = machines ?: emptyList()
                        if (displayMachines.isEmpty() && selectedProcess != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "No sessions running \"$selectedProcess\"",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    textAlign = TextAlign.Center,
                                )
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                            ) {
                                displayMachines.forEach { machine ->
                                    item(key = "header-${machine.name}") {
                                        MachineHeader(machine = machine)
                                    }
                                    items(
                                        items = machine.sessions,
                                        key = { "${machine.name}-${it.name}" },
                                    ) { session ->
                                        SessionCard(
                                            session = session,
                                            onClick = {
                                                onSessionTap(machine, session.name)
                                            },
                                            onWindowClick = { windowIndex ->
                                                onSessionTap(
                                                    machine,
                                                    session.name,
                                                    windowIndex = windowIndex,
                                                )
                                            },
                                            onPaneClick = { windowIndex, paneIndex ->
                                                onSessionTap(
                                                    machine,
                                                    session.name,
                                                    windowIndex = windowIndex,
                                                    paneIndex = paneIndex,
                                                )
                                            },
                                        )
                                    }
                                    item(key = "spacer-${machine.name}") {
                                        Spacer(modifier = Modifier.height(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProcessFilterChips(
    processes: List<String>,
    selectedProcess: String?,
    onProcessSelected: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        processes.forEach { process ->
            val isSelected = process == selectedProcess
            FilterChip(
                selected = isSelected,
                onClick = { onProcessSelected(process) },
                label = {
                    Text(
                        text = process,
                        style = MaterialTheme.typography.labelMedium,
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                    selectedLabelColor = MaterialTheme.colorScheme.primary,
                ),
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}
