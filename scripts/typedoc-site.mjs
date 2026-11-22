// TypeDoc plugin for the API reference at joegaudet.com/change-set/api/: each page gets the
// marketing site's link-preview meta and JSON-LD, which TypeDoc has no option for (it writes the
// canonical link and sitemap itself, from hostedBaseUrl).
import { JSX } from 'typedoc'

const SITE = 'https://joegaudet.com/change-set/'

export function load(app) {
  app.renderer.hooks.on('head.end', context => {
    const base = app.options.getValue('hostedBaseUrl')
    const url = new URL(context.page.url.replace(/(^|\/)index\.html$/, '$1'), base).href
    const title = context.page.model.isProject?.()
      ? 'change-set API reference'
      : `${context.page.model.name} · change-set API`
    const description = context.page.model.comment?.summary
      .map(part => part.text)
      .join('')
      .split('\n\n')[0]
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title,
      url,
      isPartOf: { '@type': 'WebSite', name: 'change-set', url: SITE },
      about: {
        '@type': 'SoftwareSourceCode',
        name: 'change-set',
        codeRepository: 'https://github.com/joegaudet/change-set',
        programmingLanguage: 'TypeScript',
      },
      author: { '@type': 'Person', name: 'Joe Gaudet', url: 'https://joegaudet.com/' },
    }
    return JSX.createElement(
      JSX.Fragment,
      null,
      JSX.createElement('meta', { property: 'og:type', content: 'article' }),
      JSX.createElement('meta', { property: 'og:site_name', content: 'change-set' }),
      JSX.createElement('meta', { property: 'og:title', content: title }),
      description &&
        JSX.createElement('meta', { property: 'og:description', content: description }),
      JSX.createElement('meta', { property: 'og:url', content: url }),
      // No social card image yet, so the small summary card.
      JSX.createElement('meta', { name: 'twitter:card', content: 'summary' }),
      JSX.createElement('link', {
        rel: 'alternate',
        type: 'text/plain',
        href: `${SITE}llms.txt`,
        title: 'llms.txt',
      }),
      JSX.createElement(
        'script',
        { type: 'application/ld+json' },
        JSX.createElement(JSX.Raw, { html: JSON.stringify(ld).replaceAll('<', '\\u003c') }),
      ),
    )
  })
}
