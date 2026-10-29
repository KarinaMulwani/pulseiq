-- PulseIQ: Product Feedback & Feature Request Miner
-- Supabase PostgreSQL Schema & Security Policies

-- 1. Create Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    analyzed_count INTEGER NOT NULL DEFAULT 0,
    is_synthetic BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Feedback Records Table
CREATE TABLE IF NOT EXISTS public.feedback_records (
    id TEXT PRIMARY KEY,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date DATE,
    segment TEXT,
    product TEXT,
    source TEXT,
    rating SMALLINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Feedback Analyses Table
CREATE TABLE IF NOT EXISTS public.feedback_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id TEXT UNIQUE REFERENCES public.feedback_records(id) ON DELETE CASCADE,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score NUMERIC(3, 2) NOT NULL,
    primary_category TEXT NOT NULL,
    pain_point TEXT,
    feature_request TEXT,
    is_explicit_request BOOLEAN DEFAULT false,
    product_area TEXT,
    explanation TEXT NOT NULL,
    key_quotes TEXT[] DEFAULT '{}',
    model_used TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Discovered Themes Table
CREATE TABLE IF NOT EXISTS public.discovered_themes (
    id TEXT PRIMARY KEY,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    sentiment_positive INTEGER NOT NULL DEFAULT 0,
    sentiment_neutral INTEGER NOT NULL DEFAULT 0,
    sentiment_negative INTEGER NOT NULL DEFAULT 0,
    segment_breakdown JSONB DEFAULT '{}'::jsonb,
    representative_quotes JSONB DEFAULT '[]'::jsonb,
    growth_trend TEXT CHECK (growth_trend IN ('increasing', 'stable', 'decreasing')),
    first_seen_date DATE,
    last_seen_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Mined Feature Requests Table
CREATE TABLE IF NOT EXISTS public.mined_feature_requests (
    id TEXT PRIMARY KEY,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    normalized_title TEXT NOT NULL,
    description TEXT,
    product_area TEXT,
    mention_count INTEGER NOT NULL DEFAULT 0,
    sentiment_score NUMERIC(3, 2) NOT NULL DEFAULT 0,
    first_seen_date DATE,
    latest_seen_date DATE,
    affected_segments TEXT[] DEFAULT '{}',
    is_explicit BOOLEAN DEFAULT false,
    priority_score INTEGER NOT NULL DEFAULT 0,
    representative_quotes JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create AI Insights Table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id TEXT PRIMARY KEY,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    metric_summary TEXT NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_quotes JSONB DEFAULT '[]'::jsonb,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    hypothesis TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_dataset_id ON public.feedback_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON public.feedback_records(date);
CREATE INDEX IF NOT EXISTS idx_feedback_segment ON public.feedback_records(segment);
CREATE INDEX IF NOT EXISTS idx_feedback_product ON public.feedback_records(product);
CREATE INDEX IF NOT EXISTS idx_analyses_sentiment ON public.feedback_analyses(sentiment);
CREATE INDEX IF NOT EXISTS idx_analyses_category ON public.feedback_analyses(primary_category);
CREATE INDEX IF NOT EXISTS idx_themes_dataset ON public.discovered_themes(dataset_id);
CREATE INDEX IF NOT EXISTS idx_features_dataset ON public.mined_feature_requests(dataset_id);
CREATE INDEX IF NOT EXISTS idx_insights_dataset ON public.ai_insights(dataset_id);

-- Row Level Security (RLS) setup
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mined_feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated or service role, or public read/insert for standalone demo deployments
CREATE POLICY "Public full access on datasets" ON public.datasets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on feedback_records" ON public.feedback_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on feedback_analyses" ON public.feedback_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on discovered_themes" ON public.discovered_themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on mined_feature_requests" ON public.mined_feature_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on ai_insights" ON public.ai_insights FOR ALL USING (true) WITH CHECK (true);
