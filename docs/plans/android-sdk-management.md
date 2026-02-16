# Android SDK Management for Dotfiles

## Overview

This plan describes a standalone Android SDK management solution integrated into the dotfiles repository. The solution consists of a gum-powered TUI script (`bin/android-sdk`) that provides interactive SDK management capabilities, plus minimal fish shell configuration to expose the SDK when present.

**Target audience**: Single dev machine running Arch Linux  
**Goal**: Self-service Android SDK installation, package management, AVD management, and emulator launching  
**Philosophy**: Script-only approach (no PyInfra integration) for maximum flexibility and minimal complexity

---

## Context & Background

The dotfiles repo now includes a complete Android app at `android/` (tmux-viewer, Kotlin + Compose, AGP 8.7.3). Building this app requires:
- JDK 17 (required by AGP 8.x)
- Android SDK (platform-tools, build-tools, platforms)
- Android Emulator + system images (for testing)

Currently, no Android SDK is installed on dev machines. This plan addresses setting up and managing the SDK entirely through a standalone interactive script, avoiding PyInfra complexity.

---

## Decisions Made

### 1. Script-Only, No PyInfra Integration

**Decision**: Do NOT add Android SDK installation to `configure.py`  
**Rationale**: 
- Only one specific machine needs Android SDK (not all dotfile-managed machines)
- SDK management is interactive by nature (selecting packages, creating AVDs)
- PyInfra adds complexity for something that's essentially "install once, manage occasionally"
- A standalone script provides better UX for this workflow

**Trade-off**: Requires manual first-run of the script, but gains flexibility and simplicity.

---

### 2. Arch Linux Only

**Decision**: Target Arch Linux (`pacman`) only  
**Rationale**:
- User specified "Specific machine(s)" for SDK installation
- That machine runs Arch
- Supporting multiple package managers adds complexity without immediate value
- Can be extended later if needed

**Package choices**:
- JDK: `jdk17-openjdk` (pacman package)
- KVM: Already in Linux kernel; just needs user in `kvm` group

---

### 3. Interactive TUI with Gum

**Decision**: Full gum-based TUI following existing dotfiles patterns  
**Rationale**:
- Matches existing scripts (`wmux`, `edit-env`, etc.)
- Gum already installed via `go install` in `configure.py:662`
- Provides excellent UX for complex operations (multi-select packages, AVD creation)
- The "Android SDK manager" use case is fundamentally interactive

**Key patterns from existing scripts**:
- `#!/bin/bash` + `set -euo pipefail`
- Color constants (`GREEN`, `YELLOW`, `RED`, `BLUE`, `NC`)
- `main()` function + `main "$@"` at end
- Heavy use of `gum choose`, `gum filter`, `gum input`, `gum confirm`

---

### 4. Emulator Launch Mode

**Decision**: Launch emulator in background, return to menu  
**Rationale**:
- Emulator is long-running; blocking the script is poor UX
- User can kill emulator via `adb emu kill` or by PID
- Allows launching multiple emulators if needed
- Script prints PID for user reference

---

### 5. SDK Location & Environment Setup

**Decision**: Install to `~/Android/Sdk` (standard location)  
**Rationale**:
- Expected by Android Studio and most tooling
- Documented as the standard in official Android docs
- Avoids permission issues (user-owned)

**Environment variables** (added to `.config/fish/conf.d/01_path.fish`):
```fish
# Android SDK
if test -d "$HOME/Android/Sdk"
    export ANDROID_HOME="$HOME/Android/Sdk"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
end

# Java (Android)
if test -d /usr/lib/jvm/java-17-openjdk-amd64
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    export PATH="$JAVA_HOME/bin:$PATH"
end
```

**Note**: Conditional on directories existing, so harmless on machines without SDK.

---

## Technical Research Summary

### Android Command-Line Tools Setup

**Download URL pattern**:
```
https://dl.google.com/android/repository/commandlinetools-linux-XXXXXXXX_latest.zip
```
The build number changes with each release. Script should use a configurable variable.

**Critical directory structure** (from official docs):
```
$ANDROID_HOME/
└── cmdline-tools/
    └── latest/
        ├── bin/
        │   ├── sdkmanager
        │   ├── avdmanager
        │   └── ...
        └── lib/
```

The zip extracts to `cmdline-tools/cmdline-tools/`, which must be renamed to `cmdline-tools/latest/`. If this is done incorrectly, `sdkmanager` fails with `NoClassDefFoundError`.

**License acceptance**:
```bash
yes | sdkmanager --licenses
```
Creates license hash files in `$ANDROID_HOME/licenses/`. Required before installing packages.

---

### sdkmanager Package Names

| Component                          | Package Identifier                              |
| ---------------------------------- | ----------------------------------------------- |
| Platform Tools                     | `"platform-tools"`                                |
| Platform API 35                    | `"platforms;android-35"`                          |
| Build Tools 35                     | `"build-tools;35.0.0"`                            |
| Emulator                           | `"emulator"`                                      |
| System Image (Google APIs, x86_64) | `"system-images;android-35;google_apis;x86_64"`   |
| System Image (Google ATD, lighter) | `"system-images;android-30;google_atd;x86"`       |
| CMake                              | `"cmake;3.22.1"`                                  |
| NDK                                | `"ndk;27.0.12077973"`                             |

**ATD images** (`google_atd` / `aosp_atd`) are ~40% more efficient for CI/testing but lack full Google Play Services.

---

### avdmanager CLI

**Create AVD**:
```bash
echo "no" | avdmanager create avd \
    -n "avd_name" \
    -k "system-images;android-35;google_apis;x86_64" \
    -d "pixel_5" \
    --force
```

**List AVDs**:
```bash
avdmanager list avd -c  # Compact output (names only)
```

**Delete AVD**:
```bash
avdmanager delete avd -n "avd_name"
```

---

### Emulator CLI

**Launch headless in background**:
```bash
emulator -avd test_avd \
    -no-window \
    -no-audio \
    -no-boot-anim \
    -gpu swiftshader &
```

**GPU modes**:
- `-gpu auto` — Let emulator choose (recommended)
- `-gpu host` — Use host GPU (best performance, requires display)
- `-gpu swiftshader` — Software renderer (headless-friendly)
- `-gpu software` — Best software rendering

**Kill emulator**:
```bash
adb -s emulator-5554 emu kill
# Or if only one running:
adb emu kill
```

---

### KVM Setup (Arch Linux)

**Check KVM support**:
```bash
egrep -c '(vmx|svm)' /proc/cpuinfo  # Should return ≥1
ls -la /dev/kvm  # Should exist
```

**Add user to kvm group** (requires re-login):
```bash
sudo gpasswd -a "$USER" kvm
```

**Verify from emulator**:
```bash
$ANDROID_HOME/emulator/emulator -accel-check
# Expected: "KVM (version XX) is installed and usable."
```

---

### JDK Requirements

| Component            | JDK Requirement |
| -------------------- | --------------- |
| AGP 8.x (in android/) | **JDK 17** (required) |
| sdkmanager / cmdline-tools | JDK 11+ (JDK 17 works) |

**Arch package**: `jdk17-openjdk`

**After installation**:
```bash
sudo archlinux-java set java-17-openjdk
# Verify
java -version  # Should show openjdk version "17.x.x"
```

---

### Disk Space Estimates

| Component                            | Installed Size |
| ------------------------------------ | -------------- |
| Command-line tools                   | ~150 MB        |
| Platform Tools                       | ~35 MB         |
| Build Tools (one version)            | ~65 MB         |
| Platform/API (one version)           | ~180 MB        |
| Emulator                             | ~600 MB        |
| System Image (`google_apis;x86_64`)    | ~1.2 GB        |
| System Image (`google_atd;x86`)        | ~600 MB        |
| AVD runtime data (per AVD, after boot) | ~1-3 GB        |

**Minimal setup** (build-only): ~500 MB  
**Build + Emulator**: ~2.5-3 GB  
**Full dev setup** (multiple APIs/images): ~5-10 GB

---

## Implementation Plan

### Phase 1: Fish Configuration

**File**: `.config/fish/conf.d/01_path.fish`

**Add conditional Android SDK environment setup**:
```fish
# Android SDK (conditional - only if installed)
if test -d "$HOME/Android/Sdk"
    export ANDROID_HOME="$HOME/Android/Sdk"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
end

# Java for Android (conditional - only if JDK 17 installed)
if test -d /usr/lib/jvm/java-17-openjdk
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk"
    export PATH="$JAVA_HOME/bin:$PATH"
end
```

**Note**: The JDK path on Arch is `/usr/lib/jvm/java-17-openjdk` (no `-amd64` suffix like Debian).

---

### Phase 2: Create `bin/android-sdk` Script

**Location**: `/home/rfhold/dot/bin/android-sdk`  
**Estimated size**: ~300-400 lines  
**Executable**: `chmod +x bin/android-sdk`

#### Script Structure

```
#!/bin/bash
set -euo pipefail

# Configuration
ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
check_prerequisites() { ... }
is_sdk_installed() { ... }
bootstrap_sdk() { ... }
install_packages() { ... }
remove_packages() { ... }
update_all() { ... }
manage_avds() { ... }
launch_emulator() { ... }
show_status() { ... }
main() { ... }

main "$@"
```

#### Key Functions

##### 1. `check_prerequisites()`

Check for required tools, offer to install missing ones:
- `gum` (should already be installed via Go)
- `java` (JDK 17)
- `wget`
- `unzip`

If JDK 17 missing:
```bash
gum confirm "JDK 17 not found. Install via pacman?" && \
sudo pacman -S --noconfirm jdk17-openjdk && \
sudo archlinux-java set java-17-openjdk
```

If KVM not accessible:
```bash
if ! groups | grep -q kvm; then
    gum confirm "Add $USER to kvm group for hardware acceleration?" && \
    sudo gpasswd -a "$USER" kvm
    echo -e "${YELLOW}Log out and back in for KVM access${NC}"
fi
```

##### 2. `bootstrap_sdk()`

First-run setup if `sdkmanager` not found:
1. Show explanation: "Android SDK not found. This will download and install..."
2. Confirm via `gum confirm`
3. Create `$ANDROID_HOME/cmdline-tools` directory
4. Download command-line tools zip
5. Extract and rename to `cmdline-tools/latest/`
6. Accept licenses: `yes | sdkmanager --licenses`
7. Install baseline packages:
   ```bash
   sdkmanager "platform-tools" \
              "platforms;android-35" \
              "build-tools;35.0.0" \
              "emulator"
   ```
8. Prompt to install a system image for emulator (optional):
   ```bash
   if gum confirm "Install system image for emulator?"; then
       IMAGE=$(gum choose \
           "system-images;android-35;google_apis;x86_64" \
           "system-images;android-30;google_atd;x86" \
           "Skip")
       [ "$IMAGE" != "Skip" ] && sdkmanager "$IMAGE"
   fi
   ```

##### 3. `install_packages()`

Interactive package installation:
1. Run `sdkmanager --list` and parse output
2. Filter to show only uninstalled packages
3. Use `gum filter --multi --header "Select packages to install"` for selection
4. Confirm: `gum confirm "Install X packages?"`
5. Install: `sdkmanager "$package1" "$package2" ...`
6. Show success message with installed package names

##### 4. `remove_packages()`

Interactive package removal:
1. Run `sdkmanager --list_installed` (or parse `sdkmanager --list` for installed)
2. Use `gum filter --multi --header "Select packages to remove"`
3. Confirm with package list shown
4. Uninstall: `sdkmanager --uninstall "$package1" "$package2" ...`

##### 5. `update_all()`

Update all installed packages:
1. Show current installed packages
2. `gum confirm "Update all SDK packages?"`
3. Run `sdkmanager --update`
4. Show summary of updated packages

##### 6. `manage_avds()`

Sub-menu for AVD management:
```bash
action=$(gum choose \
    "List AVDs" \
    "Create AVD" \
    "Delete AVD" \
    "Back to main menu")
```

**List AVDs**:
```bash
avdmanager list avd
```

**Create AVD**:
1. List installed system images: `sdkmanager --list_installed | grep system-images`
2. If no images installed:
   ```bash
   echo -e "${YELLOW}No system images installed. Install one first.${NC}"
   return
   ```
3. Use `gum choose` to select from installed images
4. `gum input --prompt "AVD name: "` for name
5. `gum choose` for device profile (offer common ones: `pixel_5`, `pixel_7_pro`, `pixel_tablet`, etc.)
6. Create:
   ```bash
   echo "no" | avdmanager create avd \
       -n "$avd_name" \
       -k "$system_image" \
       -d "$device_profile" \
       --force
   ```
7. Show success message

**Delete AVD**:
1. List AVDs: `avdmanager list avd -c`
2. `gum choose` from list
3. `gum confirm "Delete AVD '$avd_name'?"`
4. Delete: `avdmanager delete avd -n "$avd_name"`

##### 7. `launch_emulator()`

Interactive emulator launch:
1. List available AVDs: `avdmanager list avd -c`
2. If none:
   ```bash
   echo -e "${YELLOW}No AVDs found. Create one first.${NC}"
   return
   ```
3. `gum choose` to select AVD
4. `gum choose` for GPU mode:
   ```bash
   gpu_mode=$(gum choose \
       "auto (Recommended)" \
       "host (best performance)" \
       "swiftshader (software rendering)" \
       "software")
   ```
5. `gum confirm "Launch headless (no window)?"` → sets `-no-window -no-audio -no-boot-anim`
6. Build command:
   ```bash
   cmd="emulator -avd $avd_name -gpu ${gpu_mode%% *}"
   [ "$headless" = true ] && cmd="$cmd -no-window -no-audio -no-boot-anim"
   ```
7. Launch in background:
   ```bash
   $cmd &
   pid=$!
   echo -e "${GREEN}Emulator launched in background${NC}"
   echo -e "${BLUE}PID: $pid${NC}"
   echo -e "${YELLOW}Kill with: adb emu kill${NC}"
   ```

##### 8. `show_status()`

Display comprehensive status:

**Installed Packages**:
```bash
echo -e "${BLUE}Installed SDK Packages:${NC}"
sdkmanager --list_installed 2>/dev/null | tail -n +4 | head -n -1
```

**AVDs**:
```bash
echo -e "\n${BLUE}AVDs:${NC}"
avdmanager list avd -c
```

**Disk Usage**:
```bash
echo -e "\n${BLUE}Disk Usage:${NC}"
du -sh "$ANDROID_HOME" 2>/dev/null || echo "SDK not installed"
du -sh "$HOME/.android/avd" 2>/dev/null || echo "No AVDs"
```

**KVM Status**:
```bash
echo -e "\n${BLUE}Hardware Acceleration (KVM):${NC}"
if [ -c /dev/kvm ]; then
    if groups | grep -q kvm; then
        echo -e "${GREEN}✓ KVM available and accessible${NC}"
        $ANDROID_HOME/emulator/emulator -accel-check 2>&1 || true
    else
        echo -e "${YELLOW}⚠ KVM exists but user not in kvm group${NC}"
        echo -e "${YELLOW}  Run: sudo gpasswd -a \$USER kvm${NC}"
    fi
else
    echo -e "${RED}✗ KVM not available${NC}"
fi
```

**Running Emulators**:
```bash
echo -e "\n${BLUE}Running Emulators:${NC}"
adb devices 2>/dev/null | grep emulator || echo "None"
```

##### 9. `main()`

Main menu loop:

```bash
main() {
    check_prerequisites
    
    if ! is_sdk_installed; then
        bootstrap_sdk
    fi
    
    while true; do
        echo ""
        echo -e "${GREEN}Android SDK Manager${NC}"
        echo "===================="
        
        action=$(gum choose \
            "Install packages" \
            "Remove packages" \
            "Update all" \
            "Manage AVDs" \
            "Launch emulator" \
            "Status" \
            "Quit")
        
        case "$action" in
            "Install packages") install_packages ;;
            "Remove packages") remove_packages ;;
            "Update all") update_all ;;
            "Manage AVDs") manage_avds ;;
            "Launch emulator") launch_emulator ;;
            "Status") show_status ;;
            "Quit") 
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
        esac
    done
}
```

---

## Implementation Checklist

- [ ] **Phase 1: Fish Configuration**
  - [ ] Edit `.config/fish/conf.d/01_path.fish`
  - [ ] Add conditional `ANDROID_HOME` export
  - [ ] Add conditional `JAVA_HOME` export
  - [ ] Add SDK directories to PATH
  - [ ] Test: source config, verify vars only set when directories exist

- [ ] **Phase 2: Android SDK Script**
  - [ ] Create `bin/android-sdk` file
  - [ ] Add script header (shebang, set flags, config constants)
  - [ ] Add color constants
  - [ ] Implement `check_prerequisites()`
  - [ ] Implement `is_sdk_installed()`
  - [ ] Implement `bootstrap_sdk()`
  - [ ] Implement `install_packages()`
  - [ ] Implement `remove_packages()`
  - [ ] Implement `update_all()`
  - [ ] Implement `manage_avds()` with sub-menu
  - [ ] Implement `launch_emulator()`
  - [ ] Implement `show_status()`
  - [ ] Implement `main()` with menu loop
  - [ ] Make executable: `chmod +x bin/android-sdk`
  - [ ] Test first-run bootstrap flow
  - [ ] Test all menu actions

- [ ] **Phase 3: Testing & Validation**
  - [ ] Test on clean machine (no SDK)
  - [ ] Verify JDK 17 installation prompt
  - [ ] Verify KVM group prompt
  - [ ] Verify license acceptance
  - [ ] Test package install/remove
  - [ ] Test AVD create/delete
  - [ ] Test emulator launch (headless and windowed)
  - [ ] Verify environment variables in new shell
  - [ ] Test building the `android/` app after setup

- [ ] **Phase 4: Documentation**
  - [ ] Add usage notes to main README
  - [ ] Document `android-sdk` command in README's tools section
  - [ ] Update this plan document with any deviations from implementation

---

## Usage (Post-Implementation)

### First Run

```bash
# Run the script (will prompt for JDK, SDK bootstrap, etc.)
android-sdk
```

The script will:
1. Check for prerequisites (JDK, gum, wget, unzip)
2. Offer to install missing prerequisites via pacman
3. If SDK not found, offer to bootstrap (download, extract, install baseline)
4. Present main menu

### Subsequent Runs

```bash
android-sdk
```

Main menu with actions:
- **Install packages** — Browse and multi-select from available SDK packages
- **Remove packages** — Browse and multi-select from installed packages to remove
- **Update all** — Update all installed SDK components to latest versions
- **Manage AVDs** — Create, list, or delete Android Virtual Devices
- **Launch emulator** — Choose AVD, GPU mode, headless option, and launch
- **Status** — View installed packages, AVDs, disk usage, KVM status, running emulators
- **Quit** — Exit

### Building the Android App

After SDK setup:

```bash
cd ~/dot/android
./gradlew build
```

Or to install on a connected device/emulator:

```bash
./gradlew installDebug
```

---

## Open Questions & Future Enhancements

### Open Questions
None currently. All design decisions have been made.

### Future Enhancements (Out of Scope for Initial Implementation)

1. **Multi-distro support**: Extend to Debian/Ubuntu (`apt`) and macOS (`brew`)
2. **PyInfra integration**: Add optional bootstrap to `configure.py` for automated deployment
3. **Emulator management UI**: Show running emulators in status, offer to kill them
4. **Gradle wrapper support**: Detect and offer to install specific Gradle versions
5. **NDK management**: Add dedicated NDK version selection (currently just via package install)
6. **System image recommendations**: Suggest appropriate images based on target API in `android/app/build.gradle.kts`
7. **CI setup mode**: Non-interactive mode for headless CI environments
8. **Snapshot management**: Create/restore/delete emulator snapshots via AVD config

---

## References

### Official Documentation
- [Android Command-Line Tools](https://developer.android.com/studio#command-line-tools-only)
- [sdkmanager](https://developer.android.com/tools/sdkmanager)
- [avdmanager](https://developer.android.com/tools/avdmanager)
- [Emulator Command-Line Options](https://developer.android.com/studio/run/emulator-commandline)
- [Hardware Acceleration for Emulator](https://developer.android.com/studio/run/emulator-acceleration)
- [JDK Requirements](https://developer.android.com/build/jdks)
- [Environment Variables](https://developer.android.com/tools/variables)

### Community Resources
- [mrk-han's CI Emulator Guide](https://gist.github.com/mrk-han/66ac1a724456cadf1c93f4218c6060ae) (458 stars)
- [nhtua's Headless Ubuntu Setup](https://gist.github.com/nhtua/2d294f276dc1e110a7ac14d69c37904f) (109 stars)
- [Igalia: Minimal CLI Android Emulator on Linux](https://blogs.igalia.com/jaragunde/2023/12/setting-up-a-minimal-command-line-android-emulator-on-linux/)

### Related Files in This Repo
- `docs/tmux-viewer.md` — Android app implementation spec
- `android/` — Android app source code (Kotlin + Compose)
- `bin/wmux`, `bin/edit-env` — Reference scripts for gum TUI patterns
- `.config/fish/conf.d/01_path.fish` — PATH and environment variable configuration
- `configure.py` — PyInfra deployment script (no Android SDK integration per decision #1)

---

## Change Log

| Date       | Change                                           |
| ---------- | ------------------------------------------------ |
| 2026-02-15 | Initial plan created after research and Q&A      |
| TBD        | Implementation deviations (if any) to be logged here |
