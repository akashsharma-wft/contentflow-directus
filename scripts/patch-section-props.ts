/**
 * scripts/patch-section-props.ts
 *
 * Adds translationId and translationRow props to every section component
 * that needs them. Run once — idempotent (checks before patching).
 *
 * Usage: npx tsx scripts/patch-section-props.ts
 */

import fs from 'fs'
import path from 'path'

const SECTIONS_DIR = path.join(process.cwd(), 'sections')

// The import line to inject at the top of each file
const IMPORT_LINE = `import type { DirectusPageTranslationRow } from '@/types/directus'`

// The props to add inside the interface
const PROPS_TO_ADD = `  translationId?:  number\n  translationRow?: DirectusPageTranslationRow`

// Section files that need patching
const FILES_TO_PATCH = [
  'AnalyticsSection.tsx',
  'AuthFormSection.tsx',
  'AuthHeroSection.tsx',
  'BillingCurrentPlanSection.tsx',
  'BillingFooterSection.tsx',
  'BillingPlansGridSection.tsx',
  'BillingSuccessActionsSection.tsx',
  'BillingSuccessHeroSection.tsx',
  'BillingUsageSection.tsx',
  'CtaSection.tsx',
  'FeaturedPostsSection.tsx',
  'LoginSection.tsx',
  'PostsActionsSection.tsx',
  'PostsHeaderSection.tsx',
  'PostsSearchSection.tsx',
  'PostsStatsSection.tsx',
  'PostsTableSection.tsx',
  'RecentPostsSection.tsx',
  'SettingsDangerSection.tsx',
  'SettingsFormSection.tsx',
  'SettingsHeaderSection.tsx',
  'SettingsInfoSection.tsx',
  'SignupSection.tsx',
  'AdminSection.tsx',
]

let patched = 0
let skipped = 0

for (const filename of FILES_TO_PATCH) {
  const filepath = path.join(SECTIONS_DIR, filename)

  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠ Not found: ${filename}`)
    continue
  }

  let src = fs.readFileSync(filepath, 'utf8')

  // Already patched?
  if (src.includes('translationId?:  number') || src.includes('translationId?: number')) {
    console.log(`  ✓ Already patched: ${filename}`)
    skipped++
    continue
  }

  // 1. Add the import if not already present
  if (!src.includes("from '@/types/directus'") && !src.includes('from "@/types/directus"')) {
    // Insert after the last existing import line
    const lastImportIdx = (() => {
      const lines = src.split('\n')
      let last = 0
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) last = i
      }
      return last
    })()

    const lines = src.split('\n')
    lines.splice(lastImportIdx + 1, 0, IMPORT_LINE)
    src = lines.join('\n')
  }

  // 2. Find the Props interface and add the new fields
  // Pattern: find "interface Props {" or "interface XxxProps {" and add before closing }
  const interfaceMatch = src.match(/interface\s+\w*Props\s*\{([^}]*)\}/)
  if (!interfaceMatch) {
    console.warn(`  ⚠ No Props interface found in: ${filename}`)
    continue
  }

  const fullMatch   = interfaceMatch[0]
  const innerMatch  = interfaceMatch[1]

  // Don't add if already there
  if (innerMatch.includes('translationId')) {
    console.log(`  ✓ Already has translationId: ${filename}`)
    skipped++
    continue
  }

  const newInterface = fullMatch.replace(/\}$/, `${PROPS_TO_ADD}\n}`)
  src = src.replace(fullMatch, newInterface)

  fs.writeFileSync(filepath, src, 'utf8')
  console.log(`  ✓ Patched: ${filename}`)
  patched++
}

console.log(`\n✅ Done — patched: ${patched}, already done: ${skipped}`)
console.log('\nNow fix the deleted route files:')
console.log('  Delete app/api/admin/invites/[id]/route.ts')
console.log('  Delete app/api/admin/invites/route.ts')
console.log('  Delete app/api/admin/request-access/route.ts')
console.log('  Then run: npx tsc --noEmit')