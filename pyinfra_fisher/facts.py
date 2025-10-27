from pyinfra.api import FactBase


class FisherPlugins(FactBase):
    """
    Returns a list of installed Fisher plugins.
    
    Example:
        plugins = host.get_fact(FisherPlugins)
        # Returns: ['jorgebucaran/fisher', 'ilancosman/tide@v5']
    """
    
    command = 'fish -c "fisher list" 2>/dev/null || true'
    
    def process(self, output):
        # Filter out empty lines and return list of plugins
        # Returns empty list if Fisher is not installed or fails
        if not output:
            return []
        return [line.strip() for line in output if line.strip()]
