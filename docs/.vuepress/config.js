import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'jichangceshi.com',
  description: '机场测评、VPN 与代理订阅选择指南，覆盖套餐、节点测速、客户端教程和避坑方法。',
  bundler: viteBundler(),
  theme: defaultTheme({
    contributors: false,
    hostname: 'https://jichangceshi.com',
    lastUpdated: false,
  }),
})
