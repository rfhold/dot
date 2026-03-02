<template>
  <div class="slidev-layout cover flex flex-col items-center justify-center h-full text-center px-16">
    <div class="w-full max-w-3xl">
      <slot />
    </div>
    <!-- decorative accent line -->
    <div class="accent-bar" />
  </div>
</template>

<style scoped>
.accent-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #a78bfa 30%, #c084fc 60%, #7dd3fc 85%, transparent 100%);
}
</style>
