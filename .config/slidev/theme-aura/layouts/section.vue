<template>
  <div class="slidev-layout section flex flex-col justify-center h-full px-20">
    <!-- section number pill if provided -->
    <div v-if="$slots.number" class="section-number">
      <slot name="number" />
    </div>
    <slot />
    <!-- bottom gradient line -->
    <div class="section-line" />
  </div>
</template>

<style scoped>
.section-number {
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #a78bfa;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.section-line {
  position: absolute;
  bottom: 3rem;
  left: 5rem;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #a78bfa, #7dd3fc);
  border-radius: 2px;
}
</style>
