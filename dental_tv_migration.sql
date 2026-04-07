-- ── Dental TV: Video Request & Community Video tables ──────────────────────────
-- Run this in your Supabase SQL editor (alongside your existing supabase_schema.sql)

-- 1. Add is_admin flag to profiles (safe to run even if column exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Community-approved videos (videos added by admin approval)
CREATE TABLE IF NOT EXISTS tv_community_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id text NOT NULL,
  title text NOT NULL,
  channel text,
  specialty text,
  level text DEFAULT 'Intermediate',
  submitter_note text,
  approved_at timestamptz DEFAULT now(),
  duration text,
  created_at timestamptz DEFAULT now()
);

-- 3. Video requests submitted by users (pending admin review)
CREATE TABLE IF NOT EXISTS tv_video_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  youtube_id text NOT NULL,
  title text NOT NULL,
  channel text,
  specialty text,
  level text DEFAULT 'Intermediate',
  note text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE tv_community_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_video_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Community videos: any authenticated user can read
CREATE POLICY "Auth users can read community videos"
  ON tv_community_videos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Community videos: only admins can insert/update/delete
CREATE POLICY "Admins can manage community videos"
  ON tv_community_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Video requests: users can read their own requests; admins can read all
CREATE POLICY "Users can read own requests"
  ON tv_video_requests FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Video requests: any authenticated user can submit a request
CREATE POLICY "Auth users can submit video requests"
  ON tv_video_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Video requests: only admins can update status
CREATE POLICY "Admins can update request status"
  ON tv_video_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6. To make a user an admin (run with their UUID from auth.users):
-- UPDATE profiles SET is_admin = true WHERE id = '<your-user-uuid>';
