# PulseIQ — Product Feedback & Feature Request Miner

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38bdf8?logo=tailwind-css)
![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA_NIM_API-76b900?logo=nvidia)
![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e?logo=supabase)
![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel_Ready-black?logo=vercel)

**PulseIQ** is an enterprise-grade AI analytics application that ingests unstructured customer feedback (support tickets, G2/Capterra reviews, in-app CSAT surveys, sales call notes, and app store comments) and transforms them into actionable product intelligence.

It automatically identifies sentiment, clusters recurring friction themes, extracts prioritized feature requests with verbatim customer quotes, and generates evidence-backed analytical insights adhering to strict non-hallucination guardrails.

---

## 🚀 Key Features

1. **Executive Overview Dashboard**
   - Deterministic KPIs: Total entries, Positive %, Neutral %, Negative %, Discovered Themes, Mined Feature Requests.
   - Interactive Visualizations: Sentiment distribution donut, feedback volume & sentiment timeline, top complaint categories bar chart, most requested features bar chart, and cohort distribution.
   - Real-time highlights: Top recurring friction points and high-confidence AI insights.
   - One-click **Load Synthetic Benchmark Dataset (40 realistic multi-channel SaaS feedback entries)**.

2. **Feedback Explorer**
   - Full-text search across raw customer submissions, pain points, and analytical explanations.
   - Multi-dimensional filters: Sentiment, Category/Theme, Customer Segment (Enterprise, Mid-Market, SMB, Startup), Source Channel, and Feature Requests only.
   - Comprehensive Record Inspector Modal displaying verbatim feedback text, customer metadata, extracted quotes, and AI classification reasoning.

3. **Themes & Semantic Clustering**
   - Unsupervised grouping of customer complaints into consolidated themes (e.g., *Slow Dashboard Performance*, *Billing Transparency*, *Missing Slack Integration*, *Steep Learning Curve*).
   - Theme frequencies calculated strictly from distinct customer records.
   - Sentiment breakdown bars and growth trend indicators (*Increasing*, *Stable*, *Decreasing*).
   - Verbatim customer quotes linked directly to the underlying records.

4. **Feature Request Mining**
   - Normalizes customer requests across diverse channels into actionable backlog items.
   - Distinguishes **Explicit Direct Requests** (e.g., *"Please add Slack notifications"*) from **Inferred Friction Opportunities** (e.g., *"Export takes forever and freezes"*).
   - Priority scoring formula weighted by customer demand, multi-segment impact, and sentiment urgency.

5. **AI Insights & Trend Detection**
   - Strictly separates **Observed Mathematical Evidence** from **Hypotheses to Investigate** (preventing correlation/causation confusion).
   - Transparent sample sizes, baseline comparisons, and confidence indicators (*High*, *Medium*, *Low*).
   - One-click copy and **Executive Markdown Report** export.

6. **CSV Import & Flexible Column Mapping**
   - Drag-and-drop CSV uploader powered by Papa Parse.
   - Intelligent auto-detection of column headers (`id`, `text`, `date`, `segment`, `product`, `source`, `rating`).
   - Pre-import validation and 5-row table preview.
   - Dataset version manager with switch, re-analyze, and delete capabilities.

7. **NVIDIA NIM Model Selection & Fallback Chain**
   - OpenAI-compatible endpoint: `https://integrate.api.nvidia.com/v1`.
   - Multi-model registry:
     - `meta/llama-3.3-70b-instruct` (Primary reasoning & nuanced theme mining)
     - `mistralai/mixtral-8x7b-instruct-v0.1` (Fast structured batch processing)
     - `meta/llama-3.1-8b-instruct` (Lightweight fallback)
     - `nvidia/llama-3.1-nemotron-70b-instruct` (Enterprise synthesis)
   - Built-in zero-config deterministic NLP fallback engine ensuring 100% functionality out of the box even before configuring an API key.

8. **Dual-Tier Persistence Architecture**
   - **Tier 1 (Browser LocalStorage Engine)**: Zero-config client persistence across page reloads and browser sessions.
   - **Tier 2 (Supabase PostgreSQL)**: Full relational schema with tables, indices, and Row Level Security (`supabase/schema.sql`).

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server-side API routes, React Server Components, Vercel native |
| **Language** | TypeScript (Strict Mode) | Full end-to-end type safety across schemas, records, and AI outputs |
| **Styling** | Tailwind CSS v4 | Curated SaaS palette, warm neutral background, clean borders |
| **Icons** | Lucide React | Modern, accessible iconography |
| **Charts** | Recharts | Composable SVG charts (Pie, Bar, Area, Tooltips) |
| **Data Ingestion** | Papa Parse | RFC 4180 compliant CSV parsing with quote & delimiter handling |
| **Validation** | Zod | Runtime schema validation for AI structured JSON outputs |
| **AI API** | NVIDIA NIM API | Hosted LLM inference with fallback chains (`integrate.api.nvidia.com/v1`) |
| **Persistence** | Supabase PostgreSQL | Relational storage with RLS policies and indexed foreign keys |

---

## 📁 Project Architecture & Folder Structure

```
d:\scalezix\Project5/
├── .env.example                 # Documented environment variable template
├── .gitignore                   # Git exclusion rules (secrets & build artifacts)
├── AGENTS.md                    # Coding agent instructions
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # Strict TypeScript configuration
├── next.config.ts               # Next.js build & caching configuration
├── supabase/
│   └── schema.sql               # Full PostgreSQL schema, indexes & RLS policies
├── scripts/
│   └── test-pipeline.ts         # Automated end-to-end verification test suite
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── analyze/route.ts # Server-side NVIDIA NIM batch analysis endpoint
    │   │   └── models/route.ts  # Model registry discovery & connection tester
    │   ├── globals.css          # Design system tokens and custom scrollbars
    │   ├── layout.tsx           # Root HTML layout with Geist font & metadata
    │   └── page.tsx             # Main application orchestrator & tab routing
    ├── components/
    │   ├── dashboard/           # Overview KPI cards & Recharts components
    │   ├── explorer/            # Searchable feedback table & detail modal
    │   ├── features/            # Mined feature request backlog & rankings
    │   ├── imports/             # Drag-and-drop CSV importer & column mapper
    │   ├── insights/            # Analytical insight cards & report generator
    │   ├── layout/              # Sidebar and Topbar navigation components
    │   ├── settings/            # NVIDIA model registry & persistence settings
    │   ├── themes/              # Discovered themes & semantic clustering
    │   └── ui/                  # Reusable Badge, Button, Card, Modal components
    ├── lib/
    │   ├── ai/
    │   │   ├── analyzer.ts      # Batch analysis pipeline & concurrency limiter
    │   │   ├── clustering.ts    # Semantic theme discovery & quote attribution
    │   │   ├── feature-miner.ts # Feature normalization & priority scoring
    │   │   ├── insights-engine.ts# Deterministic statistics & hypothesis generator
    │   │   └── nvidia-client.ts # NVIDIA NIM API client with fallback retry
    │   ├── sample-data.ts       # 40-item realistic multi-channel SaaS benchmark
    │   ├── storage/
    │   │   └── data-store.tsx   # React DataStore provider & persistence manager
    │   ├── supabase/            # Client and server Supabase helpers
    │   ├── utils.ts             # Date, percent, and classname utilities
    │   └── zod-schemas.ts       # Zod schemas for AI outputs & CSV mapping
    └── types/
        └── index.ts             # Core TypeScript interfaces and data models
```

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js 18.18+ or 20+ (Node v24 tested)
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/pulseiq.git
cd pulseiq
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your credentials:
```env
# Optional: NVIDIA NIM API Key (if omitted, app runs in Zero-Config Demo Mode)
NVIDIA_API_KEY=nvapi-your-key-here

# Optional: Supabase PostgreSQL (if omitted, app persists to Browser LocalStorage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port displayed in your terminal) to explore the application.

---

## 🧪 Testing & Verification

PulseIQ includes an automated test suite verifying data integrity, NLP analysis, semantic clustering, quote preservation, feature mining, and analytical guardrails:

```bash
npm test
```

### What `npm test` Validates:
- **Test 1: Synthetic Benchmark Dataset** (40 items, unique IDs, diverse channels)
- **Test 2: Sentiment Classification** (Positive, Negative, Neutral distribution)
- **Test 3: Verbatim Quote Attribution** (Quotes are confirmed exact substrings of original records)
- **Test 4: Theme Discovery & Frequency Matching** (Theme counts match distinct underlying record counts; sentiment breakdown sums equal frequency)
- **Test 5: Feature Request Mining** (Normalization, priority score within [0, 100], explicit vs inferred ratios)
- **Test 6: Evidence-Backed AI Insights** (Deterministic numbers, sample sizes, explicit "Hypothesis to investigate" disclaimers)
- **Test 7: Edge Case Resilience** (Empty datasets, blank feedback text, division-by-zero protection)

### Production Build Check:
```bash
npm run build
```
Confirms full TypeScript strict compilation, Turbopack packaging, and Next.js static page generation.

---

## 🗄️ Supabase PostgreSQL Setup (Optional Cloud Storage)

If you wish to deploy with live cloud database persistence:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase dashboard.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. Retrieve your **Project URL** and **Anon Key** from **Project Settings > API**.
5. Add them to `.env.local` or your Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## ☁️ Vercel Deployment Guide

PulseIQ is optimized for zero-configuration deployment to Vercel:

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: PulseIQ Product Feedback Miner"
git branch -M main
git remote add origin https://github.com/your-username/pulseiq.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository.
3. In **Environment Variables**, add:
   - `NVIDIA_API_KEY` (Optional for live LLM extraction)
   - `NEXT_PUBLIC_SUPABASE_URL` (Optional for cloud DB)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Optional)
4. Click **Deploy**. Vercel will build and assign a production URL.

### Vercel Serverless Architecture Notes:
- **Request Timeouts:** Batch analysis processes in chunks of 5 records (maximum 15 items per batch) with a 28-second timeout guard, well within Vercel's 60-second limit.
- **Stateless Resilience:** File uploads are parsed client-side using Web Workers / Papa Parse, eliminating multipart server upload limits.
- **Zero Local Disk Dependency:** Uses in-memory state, browser LocalStorage, and Supabase PostgreSQL instead of local disk writes.

---

## 🎯 Internship Assessment Talking Points

When presenting this project during your assessment, highlight these design decisions:

1. **Analytical Guardrails (Fact vs. Hypothesis)**: Many AI apps fabricate causal statements (e.g., *"Product changes caused a 20% drop"*). PulseIQ strictly separates **deterministic mathematical counts** from **AI hypotheses to investigate**.
2. **Verbatim Quote Linkage**: Every theme and feature request links directly to the raw customer submission, maintaining data lineage and trust.
3. **Graceful Fallbacks & Offline Resilience**: The app works out of the box with zero external configuration via the deterministic NLP engine, but scales seamlessly to NVIDIA NIM's Llama 3.3 70B when an API key is provided.
4. **Clean Code & Strict Typing**: Every data model adheres to strict TypeScript interfaces and Zod runtime schemas.
