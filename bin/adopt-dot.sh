#!/bin/bash

# adopt-config.sh - Adopt configuration files into ~/dot directory structure
# This script helps you move config files from ~ or ~/.config to your dotfiles repo

set -euo pipefail

DOTFILES_DIR="$HOME/dot"
HOME_DIR="$DOTFILES_DIR/home"
CONFIG_DIR="$DOTFILES_DIR/.config"

# Ensure dotfiles directories exist
mkdir -p "$HOME_DIR" "$CONFIG_DIR"

# Function to display help
show_help() {
    gum format << 'EOF'
# Adopt Config Files

This script helps you adopt configuration files into your dotfiles repository.

**Usage:**
- Select whether to adopt from ~ (home) or ~/.config
- Choose the file/directory to adopt
- The original will be copied to your dotfiles directory
- Use your linking script afterwards to create the symlink

**Directory Structure:**
- Files from ~ go to ~/dot/home/
- Files from ~/.config go to ~/dot/.config/
EOF
}

# Function to get files from home directory (excluding .config and common unwanted files)
get_home_files() {
    find "$HOME" -maxdepth 1 -type f -name "*" ! -name ".config" ! -name ".DS_Store" ! -name ".Trash" ! -name ".localized" 2>/dev/null | sort
    find "$HOME" -maxdepth 1 -type d -name "*" ! -name ".config" ! -name ".Trash" ! -name ".git" ! -name ".." ! -name "." 2>/dev/null | sort
}

# Function to get files from .config directory
get_config_files() {
    if [[ -d "$HOME/.config" ]]; then
        find "$HOME/.config" -maxdepth 1 -mindepth 1 2>/dev/null | sort
    fi
}

# Function to copy file/directory to dotfiles
adopt_file() {
    local source_path="$1"
    local target_base="$2"
    local relative_path="$3"
    
    local filename=$(basename "$source_path")
    local target_path="$target_base/$filename"
    
    # Check if target already exists
    if [[ -e "$target_path" ]]; then
        gum format --type emoji ":warning: **Warning:** $filename already exists in dotfiles!"
        if ! gum confirm "Overwrite existing file?"; then
            gum format --type emoji ":x: Adoption cancelled"
            return 1
        fi
    fi
    
    # Copy the file/directory
    if [[ -d "$source_path" ]]; then
        gum format --type emoji ":file_folder: Copying directory: $relative_path"
        cp -r "$source_path" "$target_path"
    else
        gum format --type emoji ":page_facing_up: Copying file: $relative_path"
        cp "$source_path" "$target_path"
    fi
    
    gum format --type emoji ":white_check_mark: Successfully copied to: $target_path"
}

# Main function
main() {
    # Show help if requested
    if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    gum format --type emoji ":sparkles: **Config File Adoption Script** :sparkles:"
    echo
    
    # Choose source location
    SOURCE_TYPE=$(gum choose --header "Where do you want to adopt from?" \
        "Home directory (~)" \
        "Config directory (~/.config)")
    
    case "$SOURCE_TYPE" in
        "Home directory (~)")
            SOURCE_BASE="$HOME"
            TARGET_BASE="$HOME_DIR"
            FILES=$(get_home_files)
            ;;
        "Config directory (~/.config)")
            SOURCE_BASE="$HOME/.config"
            TARGET_BASE="$CONFIG_DIR"
            FILES=$(get_config_files)
            ;;
        *)
            gum format --type emoji ":x: Invalid selection"
            exit 1
            ;;
    esac
    
    # Check if there are any files to adopt
    if [[ -z "$FILES" ]]; then
        gum format --type emoji ":shrug: No adoptable files found in the selected location"
        exit 0
    fi
    
    echo
    gum format "**Available files/directories:**"
    echo
    
    # Let user choose which file to adopt
    SELECTED_FILE=$(echo "$FILES" | gum filter --header "Choose file/directory to adopt:")
    
    if [[ -z "$SELECTED_FILE" ]]; then
        gum format --type emoji ":x: No file selected"
        exit 0
    fi
    
    # Get relative path for display
    RELATIVE_PATH=$(echo "$SELECTED_FILE" | sed "s|$HOME|~|")
    
    echo
    gum format "**Selected:** $RELATIVE_PATH"
    
    # Confirm adoption
    if gum confirm "Adopt this file/directory?"; then
        adopt_file "$SELECTED_FILE" "$TARGET_BASE" "$RELATIVE_PATH"
    else
        gum format --type emoji ":x: Adoption cancelled"
    fi
}

# Run main function
main "$@"

