/**
 * scripts/migrate-body-to-html.mjs
 *
 * Reads all posts_translations from Directus.
 * For any row that has a non-null `body` (PortableText JSON) but a null `body_html`,
 * converts the PortableText to HTML and writes it to `body_html`.
 *
 * Safe to re-run — only updates rows where body_html is null.
 *
 * Usage: node scripts/migrate-body-to-html.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const env = readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#'))
  .reduce((acc, l) => {
    const eq = l.indexOf('=')
    if (eq === -1) return acc
    acc[l.slice(0, eq).trim()] = l.slice(eq + 1).trim()
    return acc
  }, {})

const BASE_URL    = env['NEXT_PUBLIC_DIRECTUS_URL'] ?? 'http://localhost:8055'
const ADMIN_TOKEN = env['DIRECTUS_ADMIN_TOKEN']

if (!ADMIN_TOKEN) {
  console.error('❌  DIRECTUS_ADMIN_TOKEN not set in .env.local')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ADMIN_TOKEN}`,
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function portableTextToHtml(body) {
  if (!body) return ''

  let blocks
  if (typeof body === 'string') {
    try { blocks = JSON.parse(body) } catch { return body }
  } else if (Array.isArray(body)) {
    blocks = body
  } else {
    return ''
  }

  return blocks.map(block => {
    if (!block || typeof block !== 'object') return ''

    if (block._type === 'block') {
      const markDefs = block.markDefs ?? []
      const children = (block.children ?? []).map(child => {
        let text = escapeHtml(child.text ?? '')
        const marks = child.marks ?? []

        // Apply inline marks (order matters: code before strong/em)
        if (marks.includes('code')) {
          text = `<code>${text}</code>`
        } else {
          if (marks.includes('strong')) text = `<strong>${text}</strong>`
          if (marks.includes('em'))     text = `<em>${text}</em>`
        }

        // Link marks
        for (const key of marks) {
          const def = markDefs.find(m => m._key === key)
          if (def?._type === 'link') {
            text = `<a href="${def.href}">${text}</a>`
          }
        }

        return text
      }).join('')

      switch (block.style) {
        case 'h1':         return `<h1>${children}</h1>`
        case 'h2':         return `<h2>${children}</h2>`
        case 'h3':         return `<h3>${children}</h3>`
        case 'h4':         return `<h4>${children}</h4>`
        case 'blockquote': return `<blockquote>${children}</blockquote>`
        default:           return children ? `<p>${children}</p>` : ''
      }
    }

    if (block._type === 'image') {
      const url = block.asset?.url ?? ''
      const alt = escapeHtml(block.alt ?? '')
      return `<img src="${url}" alt="${alt}" />`
    }

    if (block._type === 'code') {
      return `<pre><code>${escapeHtml(block.code ?? '')}</code></pre>`
    }

    return ''
  }).filter(Boolean).join('\n')
}

async function main() {
  console.log('🔄  Fetching all posts_translations…')

  const res = await fetch(`${BASE_URL}/items/posts_translations?limit=-1&fields=id,languages_code,posts_id,title,body,body_html`, {
    headers: HEADERS,
  })
  if (!res.ok) {
    console.error('❌  Failed to fetch translations:', await res.text())
    process.exit(1)
  }
  const { data: rows } = await res.json()
  console.log(`   Found ${rows.length} translation rows`)

  const toMigrate = rows.filter(r => r.body && !r.body_html)
  console.log(`   ${toMigrate.length} rows need body_html populated`)

  if (!toMigrate.length) {
    console.log('✅  Nothing to migrate.')
    return
  }

  let ok = 0
  let fail = 0

  for (const row of toMigrate) {
    let bodyData
    if (typeof row.body === 'string') {
      try { bodyData = JSON.parse(row.body) } catch { bodyData = row.body }
    } else {
      bodyData = row.body
    }

    const html = portableTextToHtml(bodyData)
    if (!html.trim()) {
      console.log(`  ⚠  Row ${row.id} (${row.languages_code}): empty conversion, skipping`)
      continue
    }

    const patchRes = await fetch(`${BASE_URL}/items/posts_translations/${row.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ body_html: html }),
    })

    if (patchRes.ok) {
      console.log(`  ✓  Row ${row.id} (${row.languages_code} "${row.title?.slice(0, 40)}")`)
      ok++
    } else {
      console.error(`  ✗  Row ${row.id}:`, await patchRes.text())
      fail++
    }
  }

  console.log(`\n✅  Done — ${ok} migrated, ${fail} failed`)
}

main().catch(err => { console.error(err); process.exit(1) })
