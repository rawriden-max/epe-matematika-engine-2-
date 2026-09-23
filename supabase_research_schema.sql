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

    -- Izinkan public delete pada hasil_pre-test & hasil_post-test (Opsional untuk pembersihan data penelitian)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_pre-test' AND policyname = 'Allow public delete hasil_pre-test') THEN
        CREATE POLICY "Allow public delete hasil_pre-test" ON public."hasil_pre-test" FOR DELETE TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasil_post-test' AND policyname = 'Allow public delete hasil_post-test') THEN
        CREATE POLICY "Allow public delete hasil_post-test" ON public."hasil_post-test" FOR DELETE TO anon USING (true);
    END IF;
END $$;

-- 4. PEMBERSIHAN DATA LAMA (HANYA SIMPAN DATA DENGAN VARIASI SELISIH SKOR BARU)
-- Jalankan query berikut jika Anda ingin langsung menghapus rekaman pre/post-test lama yang belum disesuaikan:
-- DELETE FROM public."hasil_pre-test" WHERE id BETWEEN 9 AND 32;
-- DELETE FROM public."hasil_post-test" WHERE id BETWEEN 3 AND 26;

-- =========================================================================
-- PART 3 — UNIVERSAL ASSESSMENT ENGINE & ACADEMIC INTEGRITY SCHEMA
-- =========================================================================

-- 5. Tabel Subjects (Mata Pelajaran Universal)
CREATE TABLE IF NOT EXISTS public.subjects (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    topics JSONB DEFAULT '[]'::jsonb,
    analysis_engine TEXT DEFAULT 'unconfigured',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data Subjects
INSERT INTO public.subjects (id, name, description, analysis_engine)
VALUES
    ('mathematics', 'Matematika', 'Persamaan Kuadrat, Aljabar, Trigonometri, dan Kalkulus', 'epe_math_engine'),
    ('physics', 'Fisika', 'Kinematika, Dinamika, Termodinamika, dan Listrik Magnet', 'unconfigured'),
    ('chemistry', 'Kimia', 'Stokiometri, Ikatan Kimia, Termokimia, dan Reaksi Redoks', 'unconfigured'),
    ('biology', 'Biologi', 'Sel, Genetika, Ekologi, dan Sistem Organ', 'unconfigured'),
    ('computer_science', 'Informatika & Ilmu Komputer', 'Algoritma, Pemrograman, Struktur Data, dan Basis Data', 'unconfigured')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    analysis_engine = EXCLUDED.analysis_engine;

-- 6. Tabel Universal Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
    id VARCHAR(128) PRIMARY KEY,
    subject_id VARCHAR(64) REFERENCES public.subjects(id),
    assessment_type VARCHAR(64) NOT NULL, -- PRE_TEST, DIAGNOSTIC, POST_TEST, PRACTICE
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 45,
    randomization_settings JSONB DEFAULT '{"shuffle_questions": false, "shuffle_options": false}'::jsonb,
    scoring_settings JSONB DEFAULT '{"points_per_question": 8.33, "negative_marking": false}'::jsonb,
    availability VARCHAR(32) DEFAULT 'active',
    research_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Universal Questions (Item Bank)
CREATE TABLE IF NOT EXISTS public.questions (
    id VARCHAR(128) PRIMARY KEY,
    subject VARCHAR(64) REFERENCES public.subjects(id),
    topic VARCHAR(128) NOT NULL,
    subtopic VARCHAR(128),
    grade_level VARCHAR(64) DEFAULT 'SMA/MA Kelas XI',
    difficulty VARCHAR(32) DEFAULT 'medium',
    question_type VARCHAR(64) DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    question_image TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    scoring_rule JSONB DEFAULT '{}'::jsonb,
    time_limit INT,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Relasi Many-to-Many: Assessment Questions
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    assessment_id VARCHAR(128) REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id VARCHAR(128) REFERENCES public.questions(id) ON DELETE CASCADE,
    question_order INT DEFAULT 1,
    PRIMARY KEY (assessment_id, question_id)
);

-- 9. Tabel Assessment Sessions
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    respondent_id VARCHAR(128) NOT NULL,
    respondent_name TEXT DEFAULT 'Siswa',
    assessment_id VARCHAR(128) REFERENCES public.assessments(id),
    subject_id VARCHAR(64) REFERENCES public.subjects(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    score NUMERIC(5,2) DEFAULT 0,
    accuracy NUMERIC(5,4) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Responses per Item
CREATE TABLE IF NOT EXISTS public.responses (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES public.assessment_sessions(session_id) ON DELETE CASCADE,
    question_id VARCHAR(128) REFERENCES public.questions(id),
    selected_answer TEXT,
    is_correct BOOLEAN,
    is_flagged BOOLEAN DEFAULT false,
    time_spent_seconds INT DEFAULT 0,
    modality VARCHAR(32) DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PART 2 — Telemetri Integritas Akademik: Session Events
CREATE TABLE IF NOT EXISTS public.session_events (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES public.assessment_sessions(session_id) ON DELETE CASCADE,
    respondent_id VARCHAR(128) NOT NULL,
    question_id VARCHAR(128),
    event_type VARCHAR(64) NOT NULL, -- tab_hidden, tab_visible, window_blurred, window_focused, etc.
    timestamp BIGINT NOT NULL,
    duration INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PART 2 — Academic Integrity Signals (Non-Accusatory Summary)
CREATE TABLE IF NOT EXISTS public.integrity_signals (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES public.assessment_sessions(session_id) ON DELETE CASCADE,
    respondent_id VARCHAR(128) NOT NULL,
    tab_switch_count INT DEFAULT 0,
    total_inactive_duration INT DEFAULT 0,
    rapid_answer_count INT DEFAULT 0,
    similarity_flag_count INT DEFAULT 0,
    overall_status VARCHAR(64) DEFAULT 'normal', -- normal, review_recommended, multiple_signals
    review_recommended BOOLEAN DEFAULT false,
    signals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Researcher Manual Audits & Reviews
CREATE TABLE IF NOT EXISTS public.researcher_reviews (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(128) REFERENCES public.assessment_sessions(session_id) ON DELETE CASCADE,
    reviewer_id VARCHAR(128) NOT NULL,
    review_decision VARCHAR(64) NOT NULL, -- verified_normal, flagged_irregular, excused_technical
    notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes untuk Kecepatan Query & Relasional Integritas
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON public.session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_respondent ON public.session_events(respondent_id);
CREATE INDEX IF NOT EXISTS idx_integrity_signals_session ON public.integrity_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON public.responses(session_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_reviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read on subjects and assessments
CREATE POLICY "Allow public read subjects" ON public.subjects FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read assessments" ON public.assessments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read questions" ON public.questions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read assessment_questions" ON public.assessment_questions FOR SELECT TO anon USING (true);

-- Student insert policies
CREATE POLICY "Allow student insert sessions" ON public.assessment_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow student update own session" ON public.assessment_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow student insert responses" ON public.responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow student insert session_events" ON public.session_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow student insert integrity_signals" ON public.integrity_signals FOR INSERT TO anon WITH CHECK (true);

-- Teacher/Researcher full access
CREATE POLICY "Allow teacher select sessions" ON public.assessment_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow teacher select responses" ON public.responses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow teacher select session_events" ON public.session_events FOR SELECT TO anon USING (true);
CREATE POLICY "Allow teacher select integrity_signals" ON public.integrity_signals FOR SELECT TO anon USING (true);
CREATE POLICY "Allow teacher reviews" ON public.researcher_reviews FOR ALL TO anon USING (true);
