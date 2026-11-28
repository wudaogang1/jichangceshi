<script setup>
import { computed } from 'vue'
import { airportInvites } from '../airport-invites.js'

const props = defineProps({
  provider: { type: String, required: true },
})

const invite = computed(() => airportInvites[props.provider])
</script>

<template>
  <a
    :href="invite.url"
    :data-airport-invite="provider"
    target="_blank"
    rel="sponsored nofollow noopener noreferrer"
  ><slot>{{ invite.name }}邀请注册</slot></a>
</template>
