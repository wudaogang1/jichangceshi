import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

const SITE_URL = 'https://jichangceshi.com'
const SITE_NAME = '机场测试'
const SITE_DESCRIPTION =
  '面向中文用户的机场测评、代理订阅选择、节点测速与客户端教程，强调可核对数据、证据边界和短周期实测。'

const organization = {
  '@type': 'Organization',
  name: `${SITE_NAME}（jichangceshi.com）`,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.svg`,
}

const toIsoDate = (value) => {
  if (!value) return undefined

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const pageUrl = (page) => `${SITE_URL}${page.path}`
const isArticle = (page) =>
  page.path.startsWith('/posts/') && page.path !== '/posts/'

const verificationHead = process.env.BING_SITE_VERIFICATION
  ? [
      [
        'meta',
        {
          name: 'msvalidate.01',
          content: process.env.BING_SITE_VERIFICATION,
        },
      ],
    ]
  : []

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  head: [
    [
      'meta',
      {
        name: 'robots',
        content:
          'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    ],
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['link', { rel: 'icon', href: '/images/logo.svg', type: 'image/svg+xml' }],
    ...verificationHead,
  ],
  shouldPrefetch: false,
  bundler: viteBundler(),
  extendsMarkdown: (md) => {
    const renderImage =
      md.renderer.rules.image ??
      ((tokens, index, options, _env, renderer) =>
        renderer.renderToken(tokens, index, options))

    md.renderer.rules.image = (tokens, index, ...args) => {
      tokens[index].attrSet('loading', 'lazy')
      tokens[index].attrSet('decoding', 'async')
      return renderImage(tokens, index, ...args)
    }
  },
  theme: defaultTheme({
    hostname: SITE_URL,
    repo: 'https://github.com/wudaogang1/jichangceshi',
    logo: '/images/logo.svg',
    logoAlt: '机场测试',
    docsDir: 'docs',
    docsBranch: 'main',
    editLink: true,
    editLinkText: '在 GitHub 上编辑此页',
    contributors: false,
    lastUpdated: true,
    lastUpdatedText: '最后更新',
    navbar: [
      { text: '内容目录', link: '/posts/' },
      {
        text: '选择与测评',
        children: [
          { text: '机场横向对比', link: '/posts/airport-compare.html' },
          { text: 'VPN 与机场怎么选', link: '/posts/vpn.html' },
          { text: '机场测速方法', link: '/posts/airport-speed-test.html' },
        ],
      },
      {
        text: '客户端教程',
        children: [
          { text: 'Clash Mi', link: '/posts/clash-mi.html' },
          { text: 'V2RayN', link: '/posts/v2rayn.html' },
          { text: 'Shadowrocket', link: '/posts/shadowrocket.html' },
        ],
      },
      { text: '关于本站', link: '/about.html' },
    ],
    sidebar: {
      '/posts/': [
        {
          text: '选择与方法',
          collapsible: true,
          children: [
            { text: '全部内容', link: '/posts/' },
            { text: '机场横向对比', link: '/posts/airport-compare.html' },
            { text: 'VPN 与机场怎么选', link: '/posts/vpn.html' },
            { text: '机场测速方法', link: '/posts/airport-speed-test.html' },
            {
              text: '订阅链接安全',
              link: '/posts/subscription-security.html',
            },
          ],
        },
        {
          text: '客户端教程',
          collapsible: true,
          children: [
            { text: 'Clash Mi', link: '/posts/clash-mi.html' },
            { text: 'V2RayN', link: '/posts/v2rayn.html' },
            { text: 'Shadowrocket', link: '/posts/shadowrocket.html' },
          ],
        },
        {
          text: '单项测评',
          collapsible: true,
          children: [
            { text: '边缘节点', link: '/posts/bianyunnode.html' },
            { text: 'COCODUCK', link: '/posts/cocoduck.html' },
            { text: 'Firefly', link: '/posts/firefly.html' },
            { text: '光速云', link: '/posts/guangsuyun.html' },
            { text: '快狸', link: '/posts/kuaili.html' },
            { text: '全球云', link: '/posts/quanqiuyun.html' },
            { text: '速界', link: '/posts/sujie.html' },
            { text: 'U1s1', link: '/posts/u1s1.html' },
            { text: '网际快车', link: '/posts/wangjikuaiche.html' },
            { text: '唯兔云', link: '/posts/weituyun.html' },
            { text: '无忧链接', link: '/posts/wuyou.html' },
            { text: 'XXYUN', link: '/posts/xxyun.html' },
            { text: '一翻云', link: '/posts/yifanyun.html' },
          ],
        },
      ],
      '/': false,
    },
    notFound: ['页面不存在或已经移动。'],
    backToHome: '返回首页',
    toggleColorMode: '切换配色',
    toggleSidebar: '切换目录',
    themePlugins: {
      seo: {
        canonical: SITE_URL,
        author: {
          name: `${SITE_NAME}（jichangceshi.com）`,
          url: SITE_URL,
        },
        isArticle,
        ogp: (ogp, page) => {
          const dateModified =
            toIsoDate(page.frontmatter.updated) ??
            toIsoDate(page.data.git?.updatedTime)

          return {
            ...ogp,
            ...(dateModified
              ? {
                  'og:updated_time': dateModified,
                  ...(isArticle(page)
                    ? { 'article:modified_time': dateModified }
                    : {}),
                }
              : {}),
          }
        },
        jsonLd: (jsonLd, page) => {
          const url = pageUrl(page)

          if (page.frontmatter.home) {
            return {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              alternateName: 'jichangceshi.com',
              description: SITE_DESCRIPTION,
              inLanguage: 'zh-CN',
              publisher: organization,
            }
          }

          if (!isArticle(page)) {
            return {
              ...jsonLd,
              '@type': 'WebPage',
              '@id': `${url}#webpage`,
              url,
              description: page.frontmatter.description,
              inLanguage: page.lang,
              isPartOf: { '@id': `${SITE_URL}/#website` },
            }
          }

          const { image, ...article } = jsonLd
          const images = Array.isArray(image)
            ? image.filter(Boolean)
            : image
              ? [image]
              : []
          const dateModified =
            toIsoDate(page.frontmatter.updated) ??
            toIsoDate(page.data.git?.updatedTime) ??
            article.datePublished

          return {
            ...article,
            '@type': 'Article',
            '@id': `${url}#article`,
            url,
            description: page.frontmatter.description,
            ...(images.length ? { image: images } : {}),
            dateModified,
            inLanguage: page.lang,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': url,
            },
            author: organization,
            publisher: organization,
          }
        },
        customHead: (head, page) => {
          if (page.frontmatter.home) return

          const items = [
            {
              '@type': 'ListItem',
              position: 1,
              name: '首页',
              item: `${SITE_URL}/`,
            },
          ]

          if (isArticle(page)) {
            items.push({
              '@type': 'ListItem',
              position: 2,
              name: '内容目录',
              item: `${SITE_URL}/posts/`,
            })
          }

          items.push({
            '@type': 'ListItem',
            position: items.length + 1,
            name: page.title,
            item: pageUrl(page),
          })

          head.push([
            'script',
            { type: 'application/ld+json' },
            JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: items,
            }),
          ])
        },
      },
      sitemap: {
        changefreq: 'weekly',
        modifyTimeGetter: (page) =>
          toIsoDate(page.frontmatter.updated) ??
          toIsoDate(page.data.git?.updatedTime) ??
          toIsoDate(page.frontmatter.date) ??
          '',
      },
    },
  }),
})
