import { readFileSync } from 'node:fs'
import { imageSize } from 'image-size'

const publicDirectory = new URL('./public/', import.meta.url)
const imageDirectory = new URL('images/', publicDirectory)
const defaultSocialImage = '/images/site-social.jpg'
const rasterPreviews = new Map([
  ['/images/airport-compare.svg', '/images/airport-compare-social.jpg'],
  ['/images/speed-test-method.svg', '/images/speed-test-method-social.jpg'],
  ['/images/client-import-flow.svg', '/images/client-import-flow-social.jpg'],
  ['/images/subscription-security.svg', '/images/subscription-security-social.jpg'],
  ['/images/u1s1-overview.svg', '/images/u1s1-overview-social.jpg'],
  ['/images/weituyun-overview.svg', '/images/weituyun-overview-social.jpg'],
])

const localImageDimensions = (source) => {
  if (!source?.startsWith('/images/')) return undefined

  const file = new URL(`.${source}`, publicDirectory)
  if (!file.href.startsWith(imageDirectory.href)) return undefined

  try {
    const { width, height } = imageSize(readFileSync(file))
    return width && height ? { width, height } : undefined
  } catch {
    return undefined
  }
}

export function setLocalImageSize(token) {
  const size = localImageDimensions(token.attrGet('src'))
  if (!size) return

  if (!token.attrGet('width')) token.attrSet('width', String(size.width))
  if (!token.attrGet('height')) token.attrSet('height', String(size.height))
}

export function socialImageMetadata(ogp) {
  const site = new URL(ogp['og:url'])
  let image = new URL(ogp['og:image'] || defaultSocialImage, site.origin)
  if (image.origin === site.origin && rasterPreviews.has(image.pathname)) {
    image = new URL(rasterPreviews.get(image.pathname), site.origin)
  }

  const size = image.origin === site.origin ? localImageDimensions(image.pathname) : undefined
  return {
    'og:image': image.href,
    'og:image:alt': ogp['og:title'],
    ...(size && {
      'og:image:width': String(size.width),
      'og:image:height': String(size.height),
    }),
    'twitter:card': 'summary_large_image',
    'twitter:image': image.href,
    'twitter:image:src': image.href,
    'twitter:image:alt': ogp['og:title'],
  }
}
