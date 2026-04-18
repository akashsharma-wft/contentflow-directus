# Directus Schema Plan

Complete collection/field/relation definitions for the ContentFlow → Directus migration.  
Import order: **site_config → pages → posts** (no relations between them).

---

## 1. Collection: `posts`

### Create the collection
In Directus Admin → Settings → Data Model → New Collection:
- **Collection name**: `posts`
- **Primary key**: `id` (UUID, auto-generated)
- **Timestamp fields**: enable `date_created` and `date_updated`

### Fields

| Field name      | Interface        | Type       | Notes |
|-----------------|------------------|------------|-------|
| `title`         | Input            | string     | Required |
| `slug`          | Input            | string     | Required. Add unique index on (slug, language) pair |
| `language`      | Dropdown (enum)  | string     | Options: en, hi, kn. Default: en |
| `excerpt`       | Textarea         | text       | Optional |
| `body`          | Code (JSON) or Builder | json  | Stores PortableText block array. See note below |
| `cover_image`   | Input            | string     | Direct URL string (not a file relation for simplicity) |
| `published_at`  | DateTime         | datetime   | Null = draft |
| `featured`      | Toggle           | boolean    | Default: false |
| `tags`          | Tags / JSON      | json       | String array |
| `author_id`     | Input            | string     | Supabase user UUID |
| `author_name`   | Input            | string     | |
| `author_email`  | Input            | string     | |
| `author_avatar` | Input            | string     | Direct URL |

> **body field note:** Store as JSON containing an array of PortableText block objects.
> The existing `@portabletext/react` renderer accepts this format unchanged.
> Example block:
> ```json
> [{"_type":"block","_key":"abc","style":"normal","children":[{"_type":"span","_key":"xyz","text":"Hello world","marks":[]}],"markDefs":[]}]
> ```

---

## 2. Collection: `pages`

### Create the collection
- **Collection name**: `pages`
- **Primary key**: `id` (UUID, auto-generated)

### Fields

| Field name        | Interface       | Type     | Notes |
|-------------------|-----------------|----------|-------|
| `title`           | Input           | string   | Required |
| `slug`            | Input           | string   | Required |
| `language`        | Dropdown (enum) | string   | Options: en, hi, kn. Default: en |
| `access`          | Dropdown (enum) | string   | Options: guest, user, admin. Default: guest |
| `layout`          | Dropdown (enum) | string   | Options: home, dashboard, auth. Default: home |
| `sections`        | Code (JSON)     | json     | Full section config array. Paste JSON directly |
| `seo_title`       | Input           | string   | Max 60 chars |
| `seo_description` | Textarea        | text     | Max 160 chars |
| `og_image`        | Input           | string   | URL |
| `status`          | Dropdown (enum) | string   | Options: published, draft. Default: published |

---

## 3. Collection: `site_config` (singleton)

### Create the collection
- **Collection name**: `site_config`
- **Primary key**: `id` (string — manually set to `"site-config"`)
- Disable auto-increment / UUID generation (use string PK)

### Fields

| Field name          | Interface   | Type   | Notes |
|---------------------|-------------|--------|-------|
| `site_name`         | Input       | string | e.g. "ContentFlow" |
| `navbar_config`     | Code (JSON) | json   | SiteNavbarConfig object |
| `footer_config`     | Code (JSON) | json   | SiteFooterConfig object |
| `sidebar_config`    | Code (JSON) | json   | SiteSidebarConfig object |
| `mobile_nav_config` | Code (JSON) | json   | SiteMobileNavConfig object |

### Insert the singleton row
After creating fields, insert one row manually via the API or UI:
```
POST /items/site_config
{ "id": "site-config", "site_name": "ContentFlow", ... }
```

---

## 4. Directus Permissions

### Public token (DIRECTUS_PUBLIC_TOKEN)
Grant **Read** access to:
- `posts` — filter: `published_at IS NOT NULL`
- `pages` — filter: `status = published`
- `site_config` — all rows

### Admin token (DIRECTUS_ADMIN_TOKEN)
Full CRUD on `posts`. Read on `pages` and `site_config`.  
Used only in Next.js API route handlers (server-side).

---

## 5. Index Recommendations

```sql
-- Slug + language unique pair for posts
CREATE UNIQUE INDEX idx_posts_slug_lang ON posts(slug, language)
  WHERE published_at IS NOT NULL;

-- Slug + language lookup for pages
CREATE INDEX idx_pages_slug_lang ON pages(slug, language, status);

-- Author lookup for dashboard
CREATE INDEX idx_posts_author ON posts(author_id);
```

---

## 6. Environment Variables to Add

```env
# .env.local
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN=<read-only-static-token>
DIRECTUS_ADMIN_TOKEN=<admin-static-token>
```

Generate static tokens in Directus → Settings → Access Tokens.

---

## 7. Import Order for Seeding

1. Create `site_config` singleton row
2. Create `pages` rows (home, login, signup, posts, billing, settings, analytics, admin)
3. Create `posts` rows (sample blog posts)

See `scripts/directus-seed.ts` and `scripts/seed-data/` for ready-to-import JSON payloads.
