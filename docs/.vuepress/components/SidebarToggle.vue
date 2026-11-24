<script setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useData } from '@vuepress/theme-default/client'

const emit = defineEmits(['toggle'])
const { themeLocale } = useData()
const button = useTemplateRef('button')
const expanded = ref(false)

let viewport
let container
let sidebar
let observer
let focusOnOpen = false

const syncSubmenus = () => {
  sidebar.querySelectorAll('.vp-navbar-dropdown-wrapper').forEach((group, index) => {
    const control = group.querySelector('.vp-navbar-dropdown-title-mobile')
    const list = group.querySelector('.vp-navbar-dropdown')
    if (!control || !list) return

    list.id = `site-sidebar-submenu-${index + 1}`
    control.setAttribute('aria-controls', list.id)
    control.setAttribute('aria-expanded', String(group.classList.contains('open')))
  })
}

const syncSidebar = () => {
  const wasExpanded = expanded.value
  expanded.value = viewport.matches && container.classList.contains('sidebar-open')
  const restoreFocus =
    viewport.matches && wasExpanded && !expanded.value && sidebar.contains(document.activeElement)

  sidebar.inert = viewport.matches && !expanded.value

  if (restoreFocus) button.value.focus({ preventScroll: true })
  if (expanded.value && !wasExpanded && focusOnOpen) {
    sidebar.querySelector('a[href], button')?.focus({ preventScroll: true })
  }
  focusOnOpen = false
  syncSubmenus()
}

const toggle = (event) => {
  focusOnOpen = !expanded.value && event.detail === 0
  emit('toggle')
}

const closeOnEscape = (event) => {
  if (event.key !== 'Escape' || event.defaultPrevented || !expanded.value) return

  event.preventDefault()
  emit('toggle')
  button.value.focus({ preventScroll: true })
}

onMounted(() => {
  container = button.value.closest('.vp-theme-container')
  sidebar = container?.querySelector('#site-sidebar')
  if (!sidebar) return

  viewport = window.matchMedia('(max-width: 719px)')
  observer = new MutationObserver(syncSidebar)
  observer.observe(container, { attributes: true, attributeFilter: ['class'] })
  observer.observe(sidebar, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  })
  viewport.addEventListener('change', syncSidebar)
  window.addEventListener('keydown', closeOnEscape)
  syncSidebar()
})

onUnmounted(() => {
  observer?.disconnect()
  viewport?.removeEventListener('change', syncSidebar)
  window.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <button
    ref="button"
    class="vp-toggle-sidebar-button"
    type="button"
    :aria-label="themeLocale.toggleSidebar"
    :aria-expanded="expanded"
    aria-controls="site-sidebar"
    @click="toggle"
  >
    <span class="icon" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  </button>
</template>

<style scoped>
.vp-toggle-sidebar-button {
  position: absolute;
  inset-inline-start: 1rem;
  top: 0.44rem;
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--vp-c-text);
  cursor: pointer;
}

.vp-toggle-sidebar-button:focus-visible {
  outline: 2px solid var(--vp-c-accent);
  outline-offset: -2px;
  border-radius: 0.35rem;
}

.icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  width: 1.25rem;
  height: 1.25rem;
}

.icon span {
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition: transform var(--vp-t-transform);
}

[aria-expanded='true'] .icon span:first-child {
  transform: translateY(8px) rotate(45deg);
}

[aria-expanded='true'] .icon span:nth-child(2) {
  transform: scaleX(0);
}

[aria-expanded='true'] .icon span:last-child {
  transform: translateY(-8px) rotate(-45deg);
}

@media screen and (max-width: 719px) {
  .vp-toggle-sidebar-button {
    display: grid;
  }
}
</style>
