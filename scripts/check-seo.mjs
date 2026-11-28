import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { airportInvites } from '../docs/.vuepress/airport-invites.js'

const DIST_DIR = resolve('docs/.vuepress/dist')
const SITE_URL = 'https://jichangceshi.com'
const comparisonRoute = '/posts/airport-compare'
const errors = []
const titles = new Map()
const descriptions = new Map()
const internalLinkSources = new Map()
const structuredDataByRoute = new Map()
const modifiedDatesByRoute = new Map()
const reviewTableLinksByRoute = new Map()
const airportInviteCountsByRoute = new Map()

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

const externalUrl = (href) => {
  const value = href.trim().replaceAll('&amp;', '&')
  if (!/^(?:https?:)?\/\//iu.test(value)) return undefined
  try {
    return new URL(value, SITE_URL)
  } catch {
    return undefined
  }
}

const inviteParameter = /[?&#](code|invite_code|aff|r)=/iu
const populatedInviteParameter = /[?&#](code|invite_code|aff|r)=[^&#]+/iu

const isAffiliateLink = (href, url) =>
  Boolean(url && (
    url.hostname.includes('aff') ||
    url.hostname === 'cpdd.one' ||
    inviteParameter.test(url.href) ||
    /快车\.com/iu.test(href)
  ))

const assert = (condition, message) => {
  if (!condition) errors.push(message)
}

const airportInviteUrls = new Map()
const registeredInviteUrls = new Set()
const merchantHostnames = new Set([
  'vip.dalaocloud.com',
  'xn--9kqy04az2ic00amuo.com',
  'xn--66tw07h.com',
  'f43.wjkc.xyz',
  'www.xxyun.xyz',
  'cloud.xxvip.shop',
])
// 网际快车 identifies the inviter with a dedicated subdomain.
const wangjikuaicheInviteHostname = /^[a-z]{6}\.xn--66tw07h\.com$/u
const hostname = (url) => url.hostname.replace(/\.$/u, '')

for (const [provider, { url: href }] of Object.entries(airportInvites)) {
  const url = externalUrl(href)
  assert(url, `Airport invitation for ${provider} has an invalid URL: ${href}`)
  if (url) {
    assert(
      populatedInviteParameter.test(url.href) ||
        (provider === 'wangjikuaiche' && wangjikuaicheInviteHostname.test(hostname(url))),
      `Airport invitation for ${provider} has no referral identifier: ${href}`,
    )
    assert(
      !registeredInviteUrls.has(url.href),
      `Airport invitation for ${provider} duplicates another provider's URL: ${href}`,
    )
    airportInviteUrls.set(provider, url.href)
    registeredInviteUrls.add(url.href)
    merchantHostnames.add(hostname(url))
  }
}

assert(existsSync(DIST_DIR), 'Build output is missing. Run docs:build first.')

const htmlFiles = existsSync(DIST_DIR)
  ? walk(DIST_DIR).filter((filePath) => filePath.endsWith('.html'))
  : []
const indexableRoutes = new Set()
assert(existsSync(join(DIST_DIR, '404.html')), '404.html is missing.')

for (const filePath of htmlFiles) {
  const route = routeFromFile(filePath)
  const html = readFileSync(filePath, 'utf8')
  const is404 = route === '/404.html'
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/gu)]
  const robots = [...html.matchAll(/<meta name="robots" content="([^"]+)">/gu)]

  if (is404) {
    assert(canonicals.length === 0, `${route}: error page has a canonical link.`)
    assert(
      robots.length === 1 && robots[0][1] === 'noindex, nofollow',
      `${route}: expected a single noindex, nofollow robots directive.`,
    )
  } else {
    indexableRoutes.add(route)
    const title = html.match(/<title>([^<]+)<\/title>/u)?.[1]
    const description = html.match(
      /<meta name="description" content="([^"]+)">/u,
    )?.[1]
    assert(
      canonicals.length === 1 && canonicals[0][1] === `${SITE_URL}${route}`,
      `${route}: expected a single canonical that matches the public URL.`,
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
      robots.length === 1 && robots[0][1].startsWith('index, follow,'),
      `${route}: expected a single indexable robots directive.`,
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

  const modified = html.match(/<meta property="og:updated_time" content="([^"]+)">/u)?.[1]
  if (modified) modifiedDatesByRoute.set(route, modified)

  const article = structuredData.find((schema) => schema['@type'] === 'Article')
  const editorialTimes = new Map(
    [...html.matchAll(/<time\b[^>]*data-editorial-date="(published|modified)"[^>]*datetime="([^"]+)"[^>]*>/gu)]
      .map(([, type, date]) => [type, date]),
  )
  if (route !== '/' && !is404) {
    assert(
      Boolean(modified) && editorialTimes.get('modified') === modified,
      `${route}: visible update date does not match og:updated_time.`,
    )
  }
  if (article) {
    assert(
      Boolean(article.datePublished) && editorialTimes.get('published') === article.datePublished,
      `${route}: visible publication date does not match Article datePublished.`,
    )
    assert(
      Boolean(modified) && modified === article.dateModified,
      `${route}: Article dateModified does not match og:updated_time.`,
    )
    assert(
      Date.parse(article.datePublished) <= Date.parse(article.dateModified),
      `${route}: Article dates are invalid or the update precedes publication.`,
    )
  }

  if (route === '/posts/' || route === comparisonRoute) {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/u)?.[1] ?? ''
    const reviewLinks = new Set()
    for (const [table] of main.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gu)) {
      for (const [, href] of table.matchAll(/<a\b[^>]*href="(\/posts\/[\w-]+)"/gu)) {
        reviewLinks.add(href)
      }
    }
    reviewTableLinksByRoute.set(route, reviewLinks)
  }

  const airportInviteCounts = new Map()
  airportInviteCountsByRoute.set(route, airportInviteCounts)
  for (const match of html.matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>/gu)) {
    const [tag, href] = match
    const url = externalUrl(href)
    const linkHostname = url && hostname(url)
    const provider = tag.match(/\sdata-airport-invite="([^"]*)"/u)?.[1]
    if (provider !== undefined) {
      const expected = airportInviteUrls.get(provider)
      if (!expected) {
        errors.push(`${route}: unknown airport invitation provider ${provider}.`)
      } else if (url?.href !== expected) {
        errors.push(
          `${route}: airport invitation for ${provider} points to ${href}, expected ${expected}.`,
        )
      } else {
        airportInviteCounts.set(provider, (airportInviteCounts.get(provider) ?? 0) + 1)
      }
    } else if (
      linkHostname &&
      (merchantHostnames.has(linkHostname) || wangjikuaicheInviteHostname.test(linkHostname))
    ) {
      errors.push(`${route}: airport merchant link bypasses the invitation: ${href}`)
    }
    if (provider !== undefined || isAffiliateLink(href, url)) {
      const rel = tag.match(/\brel="([^"]*)"/u)?.[1].split(/\s+/u) ?? []
      assert(
        rel.includes('sponsored') && rel.includes('nofollow'),
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
  comparisonRoute,
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

const catalogReviews = reviewTableLinksByRoute.get('/posts/') ?? new Set()
const comparisonReviews = reviewTableLinksByRoute.get(comparisonRoute) ?? new Set()
assert(catalogReviews.size > 0, '/posts/: no review links found in the catalog table.')
for (const route of catalogReviews) {
  assert(
    comparisonReviews.has(route),
    `${comparisonRoute}: a comparison table is missing the catalog review link ${route}.`,
  )
  const provider = route.slice('/posts/'.length)
  assert(
    airportInviteCountsByRoute.get(route)?.has(provider),
    `${route}: the review is missing its airport invitation.`,
  )
}

const comparisonInvites = airportInviteCountsByRoute.get(comparisonRoute)
for (const provider of Object.keys(airportInvites)) {
  assert(
    comparisonInvites?.get(provider) === 1,
    `${comparisonRoute}: expected exactly one airport invitation for ${provider}.`,
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
  const sitemapRoutes = new Set()

  assert(
    entries.length === indexableRoutes.size,
    `Sitemap contains ${entries.length} URLs; expected ${indexableRoutes.size}.`,
  )
  for (const [, entry] of entries) {
    const location = entry.match(/<loc>([^<]+)<\/loc>/u)?.[1]
    const route = location?.replace(SITE_URL, '')
    const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/u)?.[1]
    sitemapRoutes.add(route)
    assert(
      Boolean(lastmod) && lastmod === modifiedDatesByRoute.get(route),
      `${route}: sitemap lastmod is missing or does not match og:updated_time.`,
    )
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
