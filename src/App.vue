<template>
  <div id="app">

    <!-- 画布模式 -->
    <WhiteboardCanvas />
  </div>
</template>

<script setup lang="ts">
import WhiteboardCanvas from '@/components/Canvas/WhiteboardCanvas.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  background: #f5f5f5;
  position: relative;
}

</style>
