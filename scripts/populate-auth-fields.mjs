/**
 * scripts/populate-auth-fields.mjs
 *
 * One-time migration: reads login + signup pages from Directus, extracts the
 * content stored inside the sections JSON blob, and writes it to the individual
 * pages_translations fields so the visual editor shows real values instead of
 * empty forms.
 *
 * Run: node --env-file=.env.local scripts/populate-auth-fields.mjs
 */

import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk'

const url   = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://contentflow.directus.app'
const token = process.env.DIRECTUS_ADMIN_TOKEN

if (!token) { console.error('DIRECTUS_ADMIN_TOKEN not set'); process.exit(1) }

const client = createDirectus(url).with(staticToken(token)).with(rest())

async function run() {
  const pages = await client.request(
    readItems('pages', {
      filter: { slug: { _in: ['login', 'signup'] } },
      fields: ['id', 'slug', 'translations.*'],
    })
  )

  for (const page of pages) {
    console.log(`\n📄 Page: ${page.slug}`)
    for (const tr of page.translations ?? []) {
      const lang  = tr.languages_code
      const sections = tr.sections ?? []

      // Find authHeroSection
      const hero = sections.find(s => s._type === 'authHeroSection' || s.sectionType === 'authHeroSection')
      // Find authSection (form)
      const form = sections.find(s => s._type === 'authSection'     || s.sectionType === 'authSection')

      const patch = {}

      if (hero) {
        if (hero.badge)      patch.auth_hero_badge       = hero.badge
        if (hero.headline)   patch.auth_hero_headline    = hero.headline
        if (hero.footerNote) patch.auth_hero_footer_note = hero.footerNote
        const f = hero.features ?? []
        if (f[0]?.text) patch.auth_hero_feature_1_text = f[0].text
        if (f[1]?.text) patch.auth_hero_feature_2_text = f[1].text
        if (f[2]?.text) patch.auth_hero_feature_3_text = f[2].text
      }

      if (form) {
        if (form.heading)             patch.auth_heading              = form.heading
        if (form.googleLabel)         patch.auth_google_label         = form.googleLabel
        if (form.dividerLabel)        patch.auth_divider_label        = form.dividerLabel
        if (form.nameLabel)           patch.auth_name_label           = form.nameLabel
        if (form.namePlaceholder)     patch.auth_name_placeholder     = form.namePlaceholder
        if (form.emailLabel)          patch.auth_email_label          = form.emailLabel
        if (form.emailPlaceholder)    patch.auth_email_placeholder    = form.emailPlaceholder
        if (form.passwordLabel)       patch.auth_password_label       = form.passwordLabel
        if (form.passwordPlaceholder) patch.auth_password_placeholder = form.passwordPlaceholder
        if (form.submitLabel)         patch.auth_submit_label         = form.submitLabel
        if (form.footerText)          patch.auth_footer_text          = form.footerText
        if (form.footerLinkLabel)     patch.auth_footer_link_label    = form.footerLinkLabel
        if (form.footerLinkHref)      patch.auth_footer_link_href     = form.footerLinkHref
      }

      if (Object.keys(patch).length === 0) {
        console.log(`  [${lang}] nothing to patch`)
        continue
      }

      await client.request(updateItem('pages_translations', tr.id, patch))
      console.log(`  [${lang}] patched ${Object.keys(patch).length} fields:`, Object.keys(patch).join(', '))
    }
  }

  console.log('\n✅ Done')
}

run().catch(e => { console.error(e); process.exit(1) })
