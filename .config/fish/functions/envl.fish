function envl --description "Load encrypted environment variables into current session"
    set -l dotfiles_dir "$HOME/dot"
    set -l env_script "$dotfiles_dir/bin/env-select"
    
    # Check if script exists
    if not test -x "$env_script"
        echo "Error: env-select script not found at $env_script" >&2
        return 1
    end
    
    # If no argument provided, run interactive mode
    if test (count $argv) -eq 0
        # Run interactive selection
        set -l temp_file (mktemp)
        $env_script 2>$temp_file
        
        # Check if user was instructed to run envl with a group name
        set -l instruction (grep "envl\|env-load" $temp_file | sed -E 's/.*(envl|env-load)[[:space:]]+([^[:space:]]+).*/\2/')
        rm -f $temp_file
        
        if test -n "$instruction"
            # Recursively call with the group name
            envl $instruction
        end
        return
    end
    
    # Load the specified group
    set -l group_name $argv[1]
    
    echo "Loading environment group: $group_name" >&2
    
    # Get the Fish commands from the script
    set -l commands ($env_script --fish-output "$group_name" 2>/dev/null)
    
    if test $status -ne 0
        echo "Error: Failed to load environment group '$group_name'" >&2
        return 1
    end
    
    # Execute each set command
    set -l loaded_count 0
    for cmd in $commands
        eval $cmd
        set loaded_count (math $loaded_count + 1)
    end
    
    echo "✓ Loaded $loaded_count environment variables from '$group_name'" >&2
end



function env-show --description "Show variables in an encrypted environment group"
    set -l dotfiles_dir "$HOME/dot"
    set -l env_script "$dotfiles_dir/bin/env-select"
    
    if not test -x "$env_script"
        echo "Error: env-select script not found at $env_script" >&2
        return 1
    end
    
    if test (count $argv) -eq 0
        # Run interactive mode
        $env_script
    else
        # Show specific group
        $env_script --list $argv[1]
    end
end

# Optional: Create an alias
alias envs='env-show'

function env-list --description "List all available environment groups"
    set -l env_dir "$HOME/dot/env/encrypted"
    
    if not test -d "$env_dir"
        echo "No environment groups found." >&2
        return 1
    end
    
    echo "Available environment groups:"
    for file in $env_dir/*.gpg
        if test -f "$file"
            set -l group_name (basename $file .gpg)
            echo "  • $group_name"
        end
    end
end

# Optional: Create an alias
alias envls='env-list'
