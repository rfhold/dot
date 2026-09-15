function __fish_env_groups
    set -l env_script "$HOME/dot/bin/env-select"
    if test -x "$env_script"
        env BAO_ENV_NO_LOGIN=true $env_script --groups 2>/dev/null
    end
end

complete -c envl -f -a "(__fish_env_groups)" -d "Environment group"
complete -c envs -f -a "(__fish_env_groups)" -d "Environment group"
complete -c envls -f -a "(__fish_env_groups)" -d "Environment group"
