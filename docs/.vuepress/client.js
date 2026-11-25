import { defineClientConfig } from 'vuepress/client'
import AffiliateDisclosure from './components/AffiliateDisclosure.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('AffiliateDisclosure', AffiliateDisclosure)
  },
})
