-- =====================================================
-- Candidate Management System - Database Schema
-- =====================================================

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  applied_position TEXT NOT NULL,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Interviewing', 'Hired', 'Rejected')),
  resume_url TEXT,
  skills JSONB DEFAULT '[]'::JSONB,
  matching_score NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON public.candidates(applied_position);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can insert own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can update own candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can delete own candidates" ON public.candidates;

-- Create RLS Policies
-- Users can only see their own candidates
CREATE POLICY "Users can view own candidates" 
  ON public.candidates 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert candidates with their own user_id
CREATE POLICY "Users can insert own candidates" 
  ON public.candidates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own candidates
CREATE POLICY "Users can update own candidates" 
  ON public.candidates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own candidates
CREATE POLICY "Users can delete own candidates" 
  ON public.candidates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable Realtime for candidates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- =====================================================
-- Storage Configuration (run in SQL editor)
-- =====================================================
-- Note: Create storage bucket via Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: "resumes"
-- 3. Public bucket: Yes (for public resume access)
-- 4. Add policies:
--    - Allow authenticated users to upload (INSERT)
--    - Allow public read access (SELECT)
