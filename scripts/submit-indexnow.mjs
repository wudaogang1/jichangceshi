import { execFileSync } from 'node:child_process'

const SITE_HOST = 'jichangceshi.com'
const SITE_URL = `https://${SITE_HOST}`
const INDEXNOW_KEY = '2d467d5ad6ed9ccc072924c3d71d3e60'
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`

const routeFromMarkdown = (filePath) => {
  if (filePath === 'docs/README.md') return '/'
  if (!filePath.startsWith('docs/') || !filePath.endsWith('.md')) return null

  if (filePath.endsWith('/README.md')) {
    return `/${filePath.slice('docs/'.length, -'README.md'.length)}`
  }

  return `/${filePath.slice('docs/'.length, -'.md'.length)}.html`
}

const parseSitemapUrls = async () => {
  const response = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { 'user-agent': 'jichangceshi-indexnow/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Unable to read sitemap: HTTP ${response.status}`)
  }

  const xml = await response.text()
  return [...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/gu)].map(
    (match) => match[1],
  )
}

const submit = async () => {
  if (process.env.GITHUB_EVENT_NAME !== 'push') {
    console.log('IndexNow skipped: this was not a push deployment.')
    return
  }

  const before = process.env.INDEXNOW_BEFORE_SHA
  const after = process.env.INDEXNOW_AFTER_SHA

  if (!before || !after || /^0+$/u.test(before)) {
    console.log('IndexNow skipped: a complete Git comparison is unavailable.')
    return
  }

  const diff = execFileSync(
    'git',
    ['diff', '--name-status', '--find-renames', before, after],
    { encoding: 'utf8' },
  )
  const urls = new Set()
  let siteWideChange = false

  for (const line of diff.split('\n').filter(Boolean)) {
    const [status, ...paths] = line.split('\t')

    if (
      paths.some(
        (filePath) =>
          filePath === 'docs/.vuepress/config.js' ||
          filePath === 'docs/.vuepress/styles/index.scss',
      )
    ) {
      siteWideChange = true
    }

    const relevantPaths = status.startsWith('R') ? paths : [paths.at(-1)]
    for (const filePath of relevantPaths) {
      const route = routeFromMarkdown(filePath)
      if (route) urls.add(`${SITE_URL}${route}`)
    }
  }

  if (siteWideChange) {
    for (const url of await parseSitemapUrls()) urls.add(url)
  }

  const urlList = [...urls]
    .filter((url) => new URL(url).hostname === SITE_HOST)
    .sort()

  if (!urlList.length) {
    console.log('IndexNow skipped: no public page URL changed.')
    return
  }

  const response = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  })

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the request: HTTP ${response.status}`)
  }

  console.log(`IndexNow accepted ${urlList.length} changed URL(s).`)
}

submit().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
