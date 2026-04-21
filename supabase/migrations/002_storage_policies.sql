-- Migration: 002_storage_policies
-- Storage bucket policies for the 'contentflow' public bucket.
--
-- PREREQUISITE: Create the 'contentflow' bucket manually in the Supabase dashboard
--   Storage → New bucket → Name: contentflow → Public: ON → Save
-- This SQL only sets the RLS policies; it cannot create the bucket.

-- ─────────────────────────────────────────────
-- PUBLIC READ — avatar and cover image URLs are served as public URLs
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "contentflow_public_read" ON storage.objects;
CREATE POLICY "contentflow_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'contentflow');

-- ─────────────────────────────────────────────
-- AVATARS — authenticated users upload/replace their own avatar
-- Path pattern: avatars/{userId}-avatar.png
-- ProfileAvatar.tsx uses supabase.storage.from('contentflow').upload(path, file, { upsert: true })
-- upsert=true means the same path is overwritten — needs both INSERT and UPDATE policies.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
CREATE POLICY "avatars_authenticated_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contentflow'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
  );

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'contentflow'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
  );

-- ─────────────────────────────────────────────
-- COVERS — authenticated users upload post cover images
-- Path pattern: covers/{userId}-{timestamp}.{ext}
-- Uploaded from CreatePostModal / EditPostModal before post creation.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "covers_authenticated_insert" ON storage.objects;
CREATE POLICY "covers_authenticated_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'contentflow'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'covers'
  );

-- DELETE — delete-account route removes avatar via service role key (bypasses RLS).
-- No explicit DELETE policy needed for the authenticated role.
