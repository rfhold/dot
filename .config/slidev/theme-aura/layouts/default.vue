<template>
  <div class="slidev-layout default">
    <!-- left accent strip -->
    <div class="left-strip" />
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.default {
  display: flex;
  flex-direction: row;
  padding: 0;
}

.left-strip {
  width: 4px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #a78bfa 0%, #c084fc 50%, #7dd3fc 100%);
  border-radius: 0 2px 2px 0;
  margin: 2rem 0;
}

.content {
  flex: 1;
  padding: 2.5rem 3rem 2.5rem 2rem;
  overflow: hidden;
}
</style>
