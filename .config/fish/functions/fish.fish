function fish
    # Reload conf.d snippets (sorted for correct order like 01_path.fish)
    for conf in ~/.config/fish/conf.d/*.fish
        source $conf
    end
    # Reload main config
    source ~/.config/fish/config.fish
end
