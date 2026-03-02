<template>
  <div class="slidev-layout end flex flex-col items-center justify-center h-full text-center px-16">
    <div class="glow-ring" />
    <div class="content w-full max-w-2xl relative z-10">
      <slot />
    </div>
    <div class="accent-bar" />
  </div>
</template>

<style scoped>
.glow-ring {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 1px solid #a78bfa33;
  box-shadow: 0 0 80px 20px #a78bfa0d, inset 0 0 60px 10px #a78bfa08;
  pointer-events: none;
}

.accent-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #a78bfa 30%, #c084fc 60%, #7dd3fc 85%, transparent 100%);
}
</style>
