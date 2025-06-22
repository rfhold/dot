function __fish_env_groups
    set -l env_dir "$HOME/dot/env/encrypted"
    if test -d "$env_dir"
        for file in $env_dir/*.gpg
            if test -f "$file"
                basename $file .gpg
            end
        end
    end
end

complete -c env-load -f -a "(__fish_env_groups)" -d "Environment group"
complete -c env-show -f -a "(__fish_env_groups)" -d "Environment group"
complete -c envl -f -a "(__fish_env_groups)" -d "Environment group"
complete -c envs -f -a "(__fish_env_groups)" -d "Environment group"

