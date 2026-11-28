import { defineClientConfig } from 'vuepress/client'
import AffiliateDisclosure from './components/AffiliateDisclosure.vue'
import AirportInvite from './components/AirportInvite.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('AffiliateDisclosure', AffiliateDisclosure)
    app.component('AirportInvite', AirportInvite)
  },
})
