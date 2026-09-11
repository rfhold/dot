function envl --description "Load OpenBao environment variables into current session"
    set -l dotfiles_dir "$HOME/dot"
    set -l env_script "$dotfiles_dir/bin/env-select"
    
    # Check if script exists
    if not test -x "$env_script"
        echo "Error: env-select script not found at $env_script" >&2
        return 1
    end
    
    # If no argument provided, run interactive mode
    if test (count $argv) -eq 0
        set -l instruction ($env_script)
        set -l env_status $status

        if test $env_status -ne 0
            return $env_status
        end
        
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
    set -l commands ($env_script --fish-output "$group_name")
    set -l env_status $status

    if test $env_status -ne 0
        echo "Error: Failed to load environment group '$group_name'" >&2
        return 1
    end

    # Execute each set command line by line
    set -l loaded_count 0
    for cmd in $commands
        if test -n "$cmd"
            if not eval $cmd
                echo "Error: Failed to set an environment variable from '$group_name'" >&2
                return 1
            end
            set loaded_count (math $loaded_count + 1)
        end
    end

    echo "✓ Loaded $loaded_count environment variables from '$group_name'" >&2
end



function env-show --description "Show variables in an OpenBao environment group"
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
    set -l env_script "$HOME/dot/bin/env-select"
    set -l groups ($env_script --groups)
    if test $status -ne 0
        return 1
    end

    echo "Available environment groups:"
    for group_name in $groups
        echo "  $group_name"
    end
end

# Optional: Create an alias
alias envls='env-list'
