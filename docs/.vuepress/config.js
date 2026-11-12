import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { relative, sep } from 'node:path'

const SITE_URL = 'https://jichangceshi.com'
const SITE_NAME = '机场测试'
const SITE_DESCRIPTION =
  '面向中文用户的机场测评、VPN 选择、翻墙术语、网络加速器区别、节点测速与客户端教程，强调可核对数据和短周期实测。'

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
  (page.path.startsWith('/posts/') && page.path !== '/posts/') ||
  (page.path.startsWith('/topics/') && page.path !== '/topics/')

const pageKeywords = (page) => {
  const keywords = page.frontmatter.keywords

  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(', ')
  return typeof keywords === 'string' ? keywords : undefined
}

const cleanUrlPlugin = {
  name: 'clean-url-paths',
  extendsPageOptions: (pageOptions, app) => {
    if (!pageOptions.filePath?.endsWith('.md')) return

    const sourceRelative = relative(app.dir.source(), pageOptions.filePath)
      .split(sep)
      .join('/')

    if (sourceRelative === 'README.md') {
      pageOptions.path = '/'
    } else if (sourceRelative.endsWith('/README.md')) {
      pageOptions.path = `/${sourceRelative.slice(0, -'README.md'.length)}`
    } else {
      pageOptions.path = `/${sourceRelative.slice(0, -'.md'.length)}`
    }
  },
}

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

const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID?.trim()

if (ga4MeasurementId && !/^G-[A-Z0-9]+$/u.test(ga4MeasurementId)) {
  throw new Error('GA4_MEASUREMENT_ID must be a GA4 measurement ID starting with G-.')
}

const analyticsHead = ga4MeasurementId
  ? [
      [
        'script',
        {
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`,
        },
      ],
      [
        'script',
        {},
        `window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', ${JSON.stringify(ga4MeasurementId)});`,
      ],
    ]
  : []

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  head: [
    ...analyticsHead,
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
  plugins: [cleanUrlPlugin],
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
    logo: '/images/logo.svg',
    logoAlt: '机场测试',
    docsDir: 'docs',
    docsBranch: 'main',
    editLink: false,
    contributors: false,
    lastUpdated: true,
    lastUpdatedText: '最后更新',
    navbar: [
      { text: '内容目录', link: '/posts/' },
      {
        text: '概念指南',
        children: [
          { text: '四类工具怎么区分', link: '/topics/' },
          { text: '机场是什么', link: '/topics/airport' },
          { text: '翻墙是什么', link: '/topics/fanqiang' },
          { text: '加速器是什么', link: '/topics/accelerator' },
        ],
      },
      {
        text: '选择与测评',
        children: [
          { text: '机场横向对比', link: '/posts/airport-compare' },
          { text: 'VPN 与机场怎么选', link: '/posts/vpn' },
          { text: '机场测速方法', link: '/posts/airport-speed-test' },
        ],
      },
      {
        text: '客户端教程',
        children: [
          { text: 'Clash Mi', link: '/posts/clash-mi' },
          { text: 'V2RayN', link: '/posts/v2rayn' },
          { text: 'Shadowrocket', link: '/posts/shadowrocket' },
        ],
      },
      { text: '关于本站', link: '/about' },
      { text: '联系方式', link: 'https://t.me/sellvpn000' },
    ],
    sidebar: {
      '/topics/': [
        {
          text: '基础概念与区别',
          collapsible: false,
          children: [
            { text: '四类工具怎么区分', link: '/topics/' },
            { text: '机场是什么', link: '/topics/airport' },
            { text: '翻墙是什么', link: '/topics/fanqiang' },
            { text: 'VPN 与机场怎么选', link: '/posts/vpn' },
            { text: '加速器是什么', link: '/topics/accelerator' },
          ],
        },
        {
          text: '继续阅读',
          collapsible: false,
          children: [
            { text: '机场横向对比', link: '/posts/airport-compare' },
            { text: '机场测速方法', link: '/posts/airport-speed-test' },
            { text: '客户端教程目录', link: '/posts/' },
            { text: '订阅链接安全', link: '/posts/subscription-security' },
          ],
        },
      ],
      '/posts/': [
        {
          text: '选择与方法',
          collapsible: true,
          children: [
            { text: '全部内容', link: '/posts/' },
            { text: '机场、VPN 与加速器区别', link: '/topics/' },
            { text: '机场横向对比', link: '/posts/airport-compare' },
            { text: 'VPN 与机场怎么选', link: '/posts/vpn' },
            { text: '机场测速方法', link: '/posts/airport-speed-test' },
            {
              text: '订阅链接安全',
              link: '/posts/subscription-security',
            },
          ],
        },
        {
          text: '客户端教程',
          collapsible: true,
          children: [
            { text: 'Clash Mi', link: '/posts/clash-mi' },
            { text: 'V2RayN', link: '/posts/v2rayn' },
            { text: 'Shadowrocket', link: '/posts/shadowrocket' },
          ],
        },
        {
          text: '单项测评',
          collapsible: true,
          children: [
            { text: '环球梯', link: '/posts/huanqiuti' },
            { text: '榴莲云', link: '/posts/liulianyun' },
            { text: '大佬云', link: '/posts/dalaoyun' },
            { text: '闪电鼠', link: '/posts/shandianshu' },
            { text: '边缘节点', link: '/posts/bianyunnode' },
            { text: 'COCODUCK', link: '/posts/cocoduck' },
            { text: 'Firefly', link: '/posts/firefly' },
            { text: '光速云', link: '/posts/guangsuyun' },
            { text: '快狸', link: '/posts/kuaili' },
            { text: '全球云', link: '/posts/quanqiuyun' },
            { text: '速界', link: '/posts/sujie' },
            { text: 'U1s1', link: '/posts/u1s1' },
            { text: '网际快车', link: '/posts/wangjikuaiche' },
            { text: '唯兔云', link: '/posts/weituyun' },
            { text: '无忧链接', link: '/posts/wuyou' },
            { text: 'XXYUN', link: '/posts/xxyun' },
            { text: '一翻云', link: '/posts/yifanyun' },
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
          const keywords = pageKeywords(page)

          if (page.frontmatter.home) {
            return {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              alternateName: 'jichangceshi.com',
              description: SITE_DESCRIPTION,
              ...(keywords ? { keywords } : {}),
              inLanguage: 'zh-CN',
              publisher: organization,
            }
          }

          if (!isArticle(page)) {
            return {
              ...jsonLd,
              '@type':
                page.path === '/posts/' || page.path === '/topics/'
                  ? 'CollectionPage'
                  : 'WebPage',
              '@id': `${url}#webpage`,
              url,
              description: page.frontmatter.description,
              ...(keywords ? { keywords } : {}),
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
            ...(keywords ? { keywords } : {}),
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
          const faqs = Array.isArray(page.frontmatter.faqs)
            ? page.frontmatter.faqs.filter(
                (faq) => faq?.question && faq?.answer,
              )
            : []

          if (faqs.length) {
            head.push([
              'script',
              { type: 'application/ld+json' },
              JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                  },
                })),
              }),
            ])
          }

          if (page.frontmatter.home) return

          const items = [
            {
              '@type': 'ListItem',
              position: 1,
              name: '首页',
              item: `${SITE_URL}/`,
            },
          ]

          if (
            page.path.startsWith('/topics/') &&
            page.path !== '/topics/'
          ) {
            items.push({
              '@type': 'ListItem',
              position: 2,
              name: '概念指南',
              item: `${SITE_URL}/topics/`,
            })
          } else if (isArticle(page)) {
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
