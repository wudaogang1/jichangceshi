<script setup>
import ThemeSidebar from '@vuepress/theme-default/components/VPSidebar.vue'
</script>

<template>
  <ThemeSidebar id="site-sidebar">
    <template #top><slot name="top" /></template>
    <template #bottom><slot name="bottom" /></template>
  </ThemeSidebar>
</template>
