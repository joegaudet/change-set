// Builds the API reference (`npm run docs:api`) and checks what search engines and agents read
// from it: the pages, their meta, the sitemap and llms-full.txt. Vitest runs it with the rest of
// `npm test`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { beforeAll, test } from 'vitest'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const base = 'https://joegaudet.com/change-set/api/'

beforeAll(() => {
  execFileSync('npm', ['run', 'docs:api'], { cwd: root, stdio: 'inherit' })
}, 120_000)

test('every export has a page', () => {
  const index = read('docs/api/index.html')
  for (const name of ['ChangeSet', 'Attribute', 'attr', 'hasOne', 'hasMany'])
    assert.match(index, new RegExp(`>${name}<`))
  read('docs/api/classes/ChangeSet.html')
  read('docs/api/classes/Attribute.html')
})

test('pages carry canonical, link-preview and JSON-LD meta', () => {
  const page = read('docs/api/index.html')
  assert.match(page, new RegExp(`<link rel="canonical" href="${base}"`))
  assert.match(page, /<meta property="og:title" content="change-set API reference"/)
  assert.match(page, /<meta name="twitter:card" content="summary"/)
  const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(page)[1])
  assert.equal(ld['@type'], 'TechArticle')
  assert.equal(ld.url, base)
})

test('pages use the marketing site styles', () => {
  assert.match(read('docs/api/index.html'), /assets\/custom.css/)
  assert.match(read('docs/api/assets/custom.css'), /--brand-orange/)
})

test('the sitemap lists absolute API URLs', () => {
  assert.match(read('docs/api/sitemap.xml'), new RegExp(`<loc>${base}`))
})

test('llms-full.txt is llms.txt plus the API reference', () => {
  const full = read('docs/api/llms-full.txt')
  assert.ok(full.startsWith(read('docs/site/llms.txt')))
  assert.match(full, /## API reference/)
  assert.match(full, /# Class: ChangeSet/)
})

test('api.json is the TypeDoc model, for tools that read the API rather than the pages', () => {
  const model = JSON.parse(read('docs/api/api.json'))
  assert.equal(model.name, 'change-set')
  assert.ok(model.children.some(child => child.name === 'ChangeSet'))
})
