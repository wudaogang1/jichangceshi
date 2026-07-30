import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'jichangceshi.com',
  description: '',
  bundler: viteBundler(),
  theme: defaultTheme({
    contributors: false,
    hostname: 'https://jichangceshi.com',
    lastUpdated: false,
  }),
})
