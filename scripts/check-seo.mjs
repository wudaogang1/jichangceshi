import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const DIST_DIR = resolve('docs/.vuepress/dist')
const SITE_URL = 'https://jichangceshi.com'
const errors = []
const titles = new Map()
const descriptions = new Map()
const internalLinkSources = new Map()
const structuredDataByRoute = new Map()
const allowedUnmarkedAffiliateLinks = new Map([
  ['/posts/shandianshu', 'https://wudaogang.shandianshuaff.com/#/?code=oE1NhRah'],
])

const walk = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const filePath = join(directory, name)
    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath]
  })

const routeFromFile = (filePath) => {
  const relativePath = relative(DIST_DIR, filePath)
  if (relativePath === 'index.html') return '/'
  if (relativePath === '404.html') return '/404.html'
  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'index.html'.length)}`
  }
  return `/${relativePath.slice(0, -'.html'.length)}`
}

const isAffiliateLink = (href) => {
  if (!href.startsWith('http')) return false

  try {
    const url = new URL(href)
    return (
      url.hostname.includes('aff') ||
      url.hostname === 'cpdd.one' ||
      /(?:^|[?&#])(code|aff|r)=/iu.test(href) ||
      /快车\.com/iu.test(href)
    )
  } catch {
    return false
  }
}

const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

assert(existsSync(DIST_DIR), 'Build output is missing. Run docs:build first.')

const htmlFiles = existsSync(DIST_DIR)
  ? walk(DIST_DIR).filter((filePath) => filePath.endsWith('.html'))
  : []
const indexableRoutes = new Set()

for (const filePath of htmlFiles) {
  const route = routeFromFile(filePath)
  const html = readFileSync(filePath, 'utf8')
  const is404 = route === '/404.html'

  if (!is404) {
    indexableRoutes.add(route)
    const title = html.match(/<title>([^<]+)<\/title>/u)?.[1]
    const description = html.match(
      /<meta name="description" content="([^"]+)">/u,
    )?.[1]
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/u)?.[1]
    assert(
      canonical === `${SITE_URL}${route}`,
      `${route}: canonical is missing or does not match the public URL.`,
    )
    assert(
      Boolean(description && description.length >= 30),
      `${route}: meta description is missing or too short.`,
    )
    assert(
      Boolean(description && description.length <= 180),
      `${route}: meta description is longer than 180 characters.`,
    )
    assert(Boolean(title), `${route}: title is missing.`)
    assert(/<html lang="zh-CN"/u.test(html), `${route}: html lang is not zh-CN.`)
    assert(
      !/<meta name="keywords"/u.test(html),
      `${route}: legacy meta keywords should not be emitted.`,
    )
    if (title) {
      const previousRoute = titles.get(title)
      assert(!previousRoute, `${route}: duplicate title also used by ${previousRoute}.`)
      titles.set(title, route)
    }
    if (description) {
      const previousRoute = descriptions.get(description)
      assert(
        !previousRoute,
        `${route}: duplicate description also used by ${previousRoute}.`,
      )
      descriptions.set(description, route)
    }
    assert(
      (html.match(/<h1\b/gu) ?? []).length === 1,
      `${route}: expected exactly one H1.`,
    )
    assert(
      /<meta name="robots" content="index, follow,/u.test(html),
      `${route}: indexable robots directive is missing.`,
    )
  }

  assert(!html.includes('"dateModified":null'), `${route}: null dateModified.`)
  assert(!html.includes('"image":[""]'), `${route}: empty schema image.`)

  const structuredData = []
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu,
  )) {
    try {
      structuredData.push(JSON.parse(match[1]))
    } catch {
      errors.push(`${route}: invalid JSON-LD.`)
    }
  }
  structuredDataByRoute.set(route, structuredData)

  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gu)) {
    const [tag, href] = match
    const allowUnmarkedLink = allowedUnmarkedAffiliateLinks.get(route) === href
    if (isAffiliateLink(href) && !allowUnmarkedLink) {
      assert(
        /rel="[^"]*sponsored[^"]*"/u.test(tag) &&
          /rel="[^"]*nofollow[^"]*"/u.test(tag),
        `${route}: affiliate link lacks sponsored/nofollow: ${href}`,
      )
    }

    if (!href.startsWith('/') || href.startsWith('//')) continue
    const cleanHref = href.split(/[?#]/u)[0]
    if (
      cleanHref.startsWith('/assets/') ||
      cleanHref.startsWith('/images/') ||
      cleanHref === '/sitemap.xml'
    ) {
      continue
    }

    const sourceRoutes = internalLinkSources.get(cleanHref) ?? new Set()
    sourceRoutes.add(route)
    internalLinkSources.set(cleanHref, sourceRoutes)

    const target = cleanHref.endsWith('/')
      ? join(DIST_DIR, cleanHref, 'index.html')
      : cleanHref.endsWith('.html')
        ? join(DIST_DIR, cleanHref)
        : join(DIST_DIR, `${cleanHref}.html`)
    assert(existsSync(target), `${route}: broken internal link ${href}`)
  }
}

const topicArticleRoutes = [
  '/topics/airport',
  '/topics/fanqiang',
  '/topics/accelerator',
  '/posts/vpn',
]

for (const route of ['/topics/', ...topicArticleRoutes]) {
  assert(indexableRoutes.has(route), `Keyword pillar page is missing: ${route}`)
}

for (const route of topicArticleRoutes) {
  const schemas = structuredDataByRoute.get(route) ?? []
  assert(
    schemas.some((schema) => schema['@type'] === 'Article' && schema.keywords),
    `${route}: Article schema lacks keyword mapping.`,
  )
  assert(
    schemas.some((schema) => schema['@type'] === 'FAQPage'),
    `${route}: FAQPage schema is missing.`,
  )
  assert(
    (internalLinkSources.get(route)?.size ?? 0) >= 3,
    `${route}: keyword pillar has fewer than three internal link sources.`,
  )
}

assert(
  (structuredDataByRoute.get('/topics/') ?? []).some(
    (schema) => schema['@type'] === 'CollectionPage',
  ),
  '/topics/: CollectionPage schema is missing.',
)

const sitemapPath = join(DIST_DIR, 'sitemap.xml')
assert(existsSync(sitemapPath), 'sitemap.xml is missing.')

if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8')
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/gu)]
  const sitemapRoutes = new Set(
    entries.map((entry) => {
      const location = entry[1].match(/<loc>([^<]+)<\/loc>/u)?.[1]
      return location?.replace(SITE_URL, '')
    }),
  )

  assert(
    entries.length === indexableRoutes.size,
    `Sitemap contains ${entries.length} URLs; expected ${indexableRoutes.size}.`,
  )
  for (const entry of entries) {
    assert(/<lastmod>[^<]+<\/lastmod>/u.test(entry[1]), 'Sitemap URL lacks lastmod.')
  }
  for (const route of indexableRoutes) {
    assert(sitemapRoutes.has(route), `Sitemap is missing ${route}.`)
  }
}

const robotsPath = join(DIST_DIR, 'robots.txt')
assert(existsSync(robotsPath), 'robots.txt is missing.')
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8')
  assert(
    robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`),
    'robots.txt does not advertise the canonical sitemap.',
  )
}

assert(
  existsSync(join(DIST_DIR, '2d467d5ad6ed9ccc072924c3d71d3e60.txt')),
  'IndexNow key file is missing from the built site.',
)

if (errors.length) {
  console.error(`SEO checks failed (${errors.length}):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`SEO checks passed for ${indexableRoutes.size} indexable page(s).`)
