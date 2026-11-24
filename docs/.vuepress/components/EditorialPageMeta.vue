<script setup>
import { useData } from '@vuepress/theme-default/client'
import VPPageMeta from '@vuepress/theme-default/components/VPPageMeta.vue'

const { frontmatter, page, themeLocale } = useData()
</script>

<template>
  <footer v-if="page.editorialDates?.modified" class="vp-page-meta">
    <div class="vp-meta-item git-info">
      <div v-if="page.editorialDates.published" class="vp-meta-item last-updated">
        <span class="meta-item-label">首次发布：</span>
        <time
          class="meta-item-info"
          data-editorial-date="published"
          :datetime="page.editorialDates.published"
        >{{ page.editorialDates.published.slice(0, 10) }}</time>
      </div>
      <div class="vp-meta-item last-updated">
        <span class="meta-item-label">最后更新：</span>
        <time
          class="meta-item-info"
          data-editorial-date="modified"
          :datetime="page.editorialDates.modified"
        >{{ page.editorialDates.modified.slice(0, 10) }}</time>
      </div>
    </div>
  </footer>
  <VPPageMeta v-if="(frontmatter.editLink ?? themeLocale.editLink) || (frontmatter.contributors ?? themeLocale.contributors)" />
</template>
