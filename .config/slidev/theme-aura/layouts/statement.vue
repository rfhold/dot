<template>
  <div class="slidev-layout statement flex flex-col items-center justify-center h-full px-20">
    <!-- top decorative dots -->
    <div class="dots" />
    <div class="w-full max-w-3xl">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dots {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}
.dots::before,
.dots::after {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  opacity: 0.5;
}
.dots::after {
  background: #7dd3fc;
}
</style>
