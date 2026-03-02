<template>
  <div class="slidev-layout two-cols">
    <div class="col col-left">
      <slot />
    </div>
    <div class="divider" />
    <div class="col col-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.two-cols {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  grid-template-rows: 1fr;
  padding: 2.5rem 3rem;
  gap: 0;
}

.col {
  padding: 0 1.5rem;
  overflow: hidden;
}

.col-left {
  padding-left: 0;
}

.col-right {
  padding-right: 0;
}

.divider {
  background: linear-gradient(180deg, transparent 0%, #a78bfa 30%, #c084fc 70%, transparent 100%);
  opacity: 0.4;
  align-self: stretch;
}
</style>
