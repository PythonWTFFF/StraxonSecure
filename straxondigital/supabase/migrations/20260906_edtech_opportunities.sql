-- Migration: Create and Seed EdTech Opportunities Matrix
-- Description: Stores evaluated problem spaces, ITCH scores, whitespace analysis, and solution concepts.

CREATE TABLE IF NOT EXISTS public.edtech_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'EdTech',
    description TEXT NOT NULL,
    severity_score NUMERIC(3, 1) NOT NULL,
    tam_score NUMERIC(3, 1) NOT NULL,
    whitespace_score NUMERIC(3, 1) NOT NULL,
    frequency_score NUMERIC(3, 1) NOT NULL,
    itch_score NUMERIC(4, 1) NOT NULL,
    solution_concept TEXT NOT NULL,
    moat TEXT NOT NULL,
    monetization_model TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast ranking by ITCH score
CREATE INDEX IF NOT EXISTS idx_edtech_opportunities_itch ON public.edtech_opportunities (itch_score DESC);
CREATE INDEX IF NOT EXISTS idx_edtech_opportunities_category ON public.edtech_opportunities (category);

-- Enable RLS
ALTER TABLE public.edtech_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on edtech_opportunities"
    ON public.edtech_opportunities
    FOR SELECT
    USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on edtech_opportunities"
    ON public.edtech_opportunities
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'authenticated')
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'authenticated');

-- Clean and seed data
DELETE FROM public.edtech_opportunities;

INSERT INTO public.edtech_opportunities (
    title, category, description, severity_score, tam_score, whitespace_score, frequency_score, itch_score, solution_concept, moat, monetization_model, target_audience
) VALUES 
(
    'Why do fresh graduates lack practical coding skills despite strong academic performance?',
    'EdTech',
    'Companies hiring fresh graduates discover candidates possess theoretical knowledge and good academic scores but cannot solve basic programming problems, debug code, or apply concepts practically because college curricula rely on theoretical lectures without providing hands-on industry-simulation labs or real-world project experience.',
    9.0, 9.0, 8.5, 7.0, 86.5,
    'ProductionSim: Automated ephemeral multi-file legacy codebases in microVMs where students solve real Jira bugs, handle merge conflicts, and get evaluated by AI code-reviewers on debugging speed, test hygiene, and system architecture.',
    'Proprietary corpus of realistic broken production codebases + automated multi-metric evaluation telemetry that enterprise hiring managers trust over resumes.',
    'B2B recruiting sponsorship and candidate skill-verification fees + B2C subscription for certified graduation credential.',
    'Engineering students, fresh CS graduates, and technical recruiters.'
),
(
    'Why are college choices influenced by referral fees instead of student aptitude?',
    'EdTech',
    'High school graduates receive biased college recommendations from counseling agencies and education consultants who prioritize their own commission structures over student aptitude, interests, or career goals, steering confused teenagers toward expensive private institutions that pay the highest referral fees.',
    9.0, 9.0, 8.5, 6.0, 85.5,
    'PurePath Counseling: A fiduciary admissions platform with zero college commissions. Uses transparent algorithm matching verified alumni career trajectories, salary distributions, and curriculum rigor directly against student aptitude assessments.',
    'Audited zero-kickback charter, verified alumni outcome database, and parent trust moat.',
    'Flat-fee student advisory subscription or outcome-aligned installment plans.',
    'High school students, college applicants, and parents.'
),
(
    'Why don’t global learning platforms support high-quality regional language instruction?',
    'EdTech',
    'Exceptionally talented students from non-metro areas who are highly skilled in their fields cannot access elite global online courses, certification programs, or educational content from top institutions because these resources are exclusively available in English and haven''t been localized into regional Indian languages.',
    7.0, 9.0, 8.0, 9.0, 85.5,
    'BhashaTech: An automated neural localization and dubbing pipeline specifically trained on technical pedagogy (Hinglish/Tamil-English transliterated technical terms), synchronized code walkthroughs, and regional AI voice-tutors.',
    'Proprietary bilingual technical terminology dictionary and localized code-explaining fine-tuned LLM.',
    'B2B course licensing to MOOC platforms/universities + affordable freemium student tier.',
    'Tier-2 and Tier-3 college students, vernacular engineers, and vocational learners.'
),
(
    'Why is scholarship information fragmented and inaccessible to low-income and rural students?',
    'EdTech',
    'Deserving students from economically weaker sections or remote areas remain unaware of available government scholarships, private grants, and financial aid opportunities because information is scattered across disconnected platforms, application processes are complex, and they lack mentors who can guide them through documentation requirements.',
    7.0, 9.0, 8.0, 7.0, 82.0,
    'VidyaSetu: An aggregated scholarship eligibility engine with single-click profile matching, localized WhatsApp notification bots, and a digital document locker that auto-fills complex state and corporate grant applications.',
    'Proprietary database of obscure NGO/CSR educational endowments + government API integrations.',
    'Corporate CSR sponsorship, state welfare partnerships, and university placement subsidies.',
    'Economically disadvantaged students, rural youth, and high school counselors.'
),
(
    'Why are mock tests and analytics inaccessible to low-income exam candidates?',
    'EdTech',
    'NEET, JEE, and competitive exam aspirants from economically disadvantaged backgrounds cannot afford premium coaching classes that provide extensive question banks, doubt-clearing support, and mock test series, leaving them relying solely on outdated textbooks without access to quality practice problems and performance analytics.',
    6.0, 9.0, 8.0, 9.0, 81.5,
    'AbhyasAI: A lightweight, mobile-first, and offline-capable adaptive test platform that uses low-latency local models to generate customized mock exams, weak-area diagnostic heatmaps, and step-by-step doubt resolution at 1/100th the cost of legacy coaching.',
    'Dynamic question synthesis engine, calibrated difficulty rating system, and extreme low-bandwidth compression.',
    'Ultra-affordable micro-passes (e.g. ₹49/month or ₹5/test) and philanthropic foundation grants.',
    'Competitive exam aspirants (JEE, NEET, SSC, UPSC) in non-metro regions.'
),
(
    'Why hasn’t tutoring shifted from answer-giving to skill-building learning?',
    'EdTech',
    'Parents hiring private tutors to help with challenging math and science subjects discover their children remain weak in fundamentals because tutors simply solve homework problems on students'' behalf rather than explaining underlying concepts, principles, and problem-solving approaches that build genuine understanding.',
    8.0, 9.0, 8.5, 8.0, 78.5,
    'SocraticMentor: An interactive learning companion that refuses to output direct homework answers. Instead, it diagnoses misconceptions through guided questions, visual interactive simulations, and first-principles reasoning prompts.',
    'Adaptive pedagogy tree that dynamically tracks student conceptual gaps and prevents cognitive reliance on direct solution generation.',
    'Parent-funded monthly subscription with weekly conceptual mastery reports.',
    'K-12 students, parents, and progressive educators.'
),
(
    'Why do resumes fail ATS filters despite candidates being qualified for roles?',
    'EdTech',
    'Fresh graduates and career switchers applying to dozens of entry-level positions receive no response or interview callbacks because corporate ATS (Applicant Tracking Systems) automatically filter out resumes lacking specific keywords, employer brand names, or exact experience criteria, and candidates lack guidance on optimizing applications for AI screening.',
    8.0, 9.0, 9.0, 7.0, 76.5,
    'TalentDecoder: A bi-directional career platform that parses job descriptions to identify latent qualification vectors, optimizes resumes for semantic ATS parsers without keyword stuffing, and links verifiable micro-project proofs of work directly into the recruiter screening view.',
    'Reverse-engineered ATS parsing parser suite and cryptographically verified proof-of-work badges.',
    'Freemium model with premium application optimization credits and talent marketplace recruiting fees.',
    'Job seekers, career switchers, and fresh university graduates.'
),
(
    'Why don’t schools provide step-by-step, student-friendly kits for complex assignments?',
    'EdTech',
    'Elementary and middle school students assigned elaborate science fair projects, working models, or craft assignments rely heavily on parental intervention because schools assign overly complex tasks without providing age-appropriate guidance, pre-assembled DIY kits, or step-by-step student-friendly instruction materials.',
    7.0, 9.0, 8.0, 6.0, 75.5,
    'MakerKid Labs: Curriculum-aligned experiential project kits shipped on-demand, paired with gamified interactive AR/video companion guides that empower children to design, build, and debug their own working science models independently.',
    'Proprietary modular hardware kits, school curriculum integration, and patent-pending interactive AR assembly instructions.',
    'Direct-to-consumer quarterly kit subscriptions and B2B school curriculum partnerships.',
    'Middle school students, parents, and STEM science teachers.'
),
(
    'Why must students commit to expensive annual subscriptions before testing exam platforms?',
    'EdTech',
    'Students wanting to try online learning platforms for exam preparation discover that most services require upfront annual subscription commitments with non-refundable payments, offering no flexibility for pay-per-topic access, course-switching, or trial periods that let students test teaching quality before major financial commitments.',
    8.0, 9.0, 8.5, 5.0, 73.5,
    'FlexiLearn: A utility-style micropayment learning marketplace where students purchase modular topic tokens (e.g. paying only for Thermodynamics or Calculus) or rent complete courses on a weekly pay-as-you-learn basis with instant course portability.',
    'Cross-platform topic-level learning credit protocol and revenue-sharing settlement network for top independent educators.',
    'Small transaction fee per module unlocked + educator marketplace platform cut.',
    'Budget-conscious students, modular learners, and self-directed test candidates.'
);
