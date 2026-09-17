-- =========================================================================
-- EPE V2.2 / V3 - Supabase Schema Migration: Pre-Test & Post-Test Research Module
-- Jalankan skrip ini di SQL Editor Dashboard Supabase Anda.
-- Skrip ini otomatis menambahkan semua kolom ke tabel "hasil_pre-test" & "hasil_post-test"
-- yang sudah Anda buat di Supabase, atau membuat tabel baru jika belum ada.
-- =========================================================================

-- 1. Tambahkan semua kolom riset ke tabel "hasil_pre-test" (tabel yang Anda buat di Supabase)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hasil_pre-test') THEN
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS attempt_id TEXT;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS student_id TEXT DEFAULT 'siswa_01';
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'Siswa';
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'pretest';
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS test_form TEXT DEFAULT 'Form A';
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,4) DEFAULT 0;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 12;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS error_distribution JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS domain_accuracy JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public."hasil_pre-test" ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '[]'::jsonb;
        
        -- Aktifkan RLS dan izin Insert / Select untuk Anonim
        ALTER TABLE public."hasil_pre-test" ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_pre-test' AND policyname = 'Allow public insert hasil_pre-test') THEN
            CREATE POLICY "Allow public insert hasil_pre-test" ON public."hasil_pre-test" FOR INSERT TO anon WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_pre-test' AND policyname = 'Allow public select hasil_pre-test') THEN
            CREATE POLICY "Allow public select hasil_pre-test" ON public."hasil_pre-test" FOR SELECT TO anon USING (true);
        END IF;
    END IF;
END $$;

-- 2. Tambahkan semua kolom riset ke tabel "hasil_post-test" (tabel yang Anda buat di Supabase)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hasil_post-test') THEN
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS attempt_id TEXT;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS student_id TEXT DEFAULT 'siswa_01';
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT 'Siswa';
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'posttest';
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS test_form TEXT DEFAULT 'Form B';
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,4) DEFAULT 0;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 12;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS error_distribution JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS domain_accuracy JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public."hasil_post-test" ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '[]'::jsonb;
        
        -- Aktifkan RLS dan izin Insert / Select untuk Anonim
        ALTER TABLE public."hasil_post-test" ENABLE ROW LEVEL SECURITY;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_post-test' AND policyname = 'Allow public insert hasil_post-test') THEN
            CREATE POLICY "Allow public insert hasil_post-test" ON public."hasil_post-test" FOR INSERT TO anon WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_post-test' AND policyname = 'Allow public select hasil_post-test') THEN
            CREATE POLICY "Allow public select hasil_post-test" ON public."hasil_post-test" FOR SELECT TO anon USING (true);
        END IF;
    END IF;
END $$;

-- 3. Cadangan tabel tanpa tanda strip (hasil_pretest & hasil_posttest)
CREATE TABLE IF NOT EXISTS public.hasil_pretest (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    attempt_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT DEFAULT 'Siswa',
    test_type TEXT DEFAULT 'pretest',
    test_form TEXT DEFAULT 'Form A',
    score NUMERIC(5,2) DEFAULT 0,
    accuracy NUMERIC(5,4) DEFAULT 0,
    correct_count INT DEFAULT 0,
    total_questions INT DEFAULT 12,
    duration_seconds INT DEFAULT 0,
    error_distribution JSONB DEFAULT '{}'::jsonb,
    domain_accuracy JSONB DEFAULT '{}'::jsonb,
    responses JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.hasil_posttest (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    attempt_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT DEFAULT 'Siswa',
    test_type TEXT DEFAULT 'posttest',
    test_form TEXT DEFAULT 'Form B',
    score NUMERIC(5,2) DEFAULT 0,
    accuracy NUMERIC(5,4) DEFAULT 0,
    correct_count INT DEFAULT 0,
    total_questions INT DEFAULT 12,
    duration_seconds INT DEFAULT 0,
    error_distribution JSONB DEFAULT '{}'::jsonb,
    domain_accuracy JSONB DEFAULT '{}'::jsonb,
    responses JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.hasil_pretest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_posttest ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_pretest' AND policyname = 'Allow public insert hasil_pretest') THEN
        CREATE POLICY "Allow public insert hasil_pretest" ON public.hasil_pretest FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_pretest' AND policyname = 'Allow public select hasil_pretest') THEN
        CREATE POLICY "Allow public select hasil_pretest" ON public.hasil_pretest FOR SELECT TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_posttest' AND policyname = 'Allow public insert hasil_posttest') THEN
        CREATE POLICY "Allow public insert hasil_posttest" ON public.hasil_posttest FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_posttest' AND policyname = 'Allow public select hasil_posttest') THEN
        CREATE POLICY "Allow public select hasil_posttest" ON public.hasil_posttest FOR SELECT TO anon USING (true);
    END IF;
END $$;
