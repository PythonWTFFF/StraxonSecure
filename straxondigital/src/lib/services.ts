// Central catalog: any new services added here automatically flow through
// services page, marketplace, customizer, checkout, and admin labelling.

export type ServiceTier = "one-time" | "subscription" | "digital";

export type ServiceCategory = "ai" | "engineering" | "growth" | "branding" | "strategy";

export type ServiceType =
  | "website"
  | "resume"
  | "branding"
  | "seo"
  | "template"
  | "social"
  | "adcopy"
  | "email"
  | "chatbot"
  | "pitchdeck"
  | "bizplan"
  | "naming"
  | "linkedin"
  | "pressrelease"
  | "saas-architecture"
  | "ai-voice-automations";

export type PackageTier = "starter" | "pro" | "enterprise";

export interface ServiceAddon {
  id: string;
  name: string;
  priceCents: number;
  description: string;
  badge?: string;
}

export interface IntakeField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "email" | "url" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ServiceDef {
  slug: string;
  name: string;
  type: ServiceType;
  category: ServiceCategory;
  tier: ServiceTier;
  priceCents: number;
  cadence?: string;
  turnaround: string;
  popular?: boolean;
  tagline: string;
  description: string;
  features: string[];
  deliverables: string[];
  intake: IntakeField[];
  customAddons?: ServiceAddon[];
}

export const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "ai", label: "AI & Automations" },
  { id: "engineering", label: "Engineering & Web" },
  { id: "growth", label: "Growth & Marketing" },
  { id: "branding", label: "Brand & Creative" },
  { id: "strategy", label: "Strategy & Career" },
] as const;

export const GLOBAL_ADDONS: ServiceAddon[] = [
  {
    id: "rush-delivery",
    name: "⚡ 12-Hour Rush Turnaround",
    priceCents: 4900,
    description: "Fast-track your job directly into top-priority queue.",
    badge: "Fastest",
  },
  {
    id: "raw-assets",
    name: "🎨 Raw Source Files & Figma Export",
    priceCents: 6900,
    description: "Receive full vector SVG, Figma design tokens, or source code.",
    badge: "Developer Ready",
  },
  {
    id: "webhook-sync",
    name: "🔗 Automated Webhook & CRM Push",
    priceCents: 3900,
    description: "Instantly route deliverables to Zapier, Make, n8n or Slack.",
    badge: "Automation",
  },
  {
    id: "strategy-call",
    name: "👥 45-Min Strategy Consultation",
    priceCents: 9900,
    description: "1-on-1 walkthrough with a Straxon senior operator.",
    badge: "High Touch",
  },
  {
    id: "unlimited-revisions",
    name: "🛡️ 30-Day Revision Guarantee",
    priceCents: 4900,
    description: "Unlimited iterative refinements until 100% satisfied.",
    badge: "Peace of Mind",
  },
];

export const PACKAGE_TIERS: Record<PackageTier, { name: string; multiplier: number; badge: string; description: string }> = {
  starter: {
    name: "Starter",
    multiplier: 1.0,
    badge: "Essential",
    description: "Core high-grade deliverable engineered to launch fast.",
  },
  pro: {
    name: "Professional",
    multiplier: 1.6,
    badge: "Most Popular",
    description: "Extended depth, multi-variant outputs, and enhanced brand tuning.",
  },
  enterprise: {
    name: "Enterprise",
    multiplier: 2.5,
    badge: "Maximum Impact",
    description: "Full white-glove assets, priority queue, and direct engineer review.",
  },
};

export const SERVICES: ServiceDef[] = [
  {
    slug: "executive-resume",
    name: "Executive Resume & Career Pack",
    type: "resume",
    category: "strategy",
    tier: "one-time",
    priceCents: 2900,
    turnaround: "24 Hours",
    popular: true,
    tagline: "ATS-beating, recruiter-tested resume in 24h",
    description:
      "Our automation engine reverse-engineers job descriptions and crafts a recruiter-grade resume tuned to land top-tier executive interviews.",
    features: ["ATS keyword optimization", "PDF + DOCX delivery", "Targeted cover letter included", "1 free revision round"],
    deliverables: ["ATS-Optimized Resume (PDF & DOCX)", "Tailored Cover Letter", "Keyword Relevance Report"],
    intake: [
      { name: "target_role", label: "Target role", kind: "text", required: true, placeholder: "Senior Product Manager / VP Engineering" },
      { name: "industry", label: "Industry", kind: "text", required: true, placeholder: "SaaS / Fintech / AI" },
      { name: "experience_years", label: "Years of experience", kind: "text", required: true, placeholder: "8+" },
      { name: "current_resume", label: "Paste your current resume / LinkedIn", kind: "textarea", required: true, placeholder: "Paste career history here..." },
      { name: "achievements", label: "Top 3 quantified achievements", kind: "textarea", required: true, placeholder: "e.g. Scaled ARR from $1M to $5M, led team of 14..." },
    ],
  },
  {
    slug: "conversion-website",
    name: "High-Conversion Website & Landing Machine",
    type: "website",
    category: "engineering",
    tier: "one-time",
    priceCents: 49900,
    turnaround: "5-7 Days",
    popular: true,
    tagline: "A 7-page conversion machine, shipped in 7 days",
    description: "Cyber-luxury landing built on the Straxon stack — animated, fully responsive, and SEO-ready out of the box.",
    features: ["7 custom pages", "Mobile-first responsive layout", "Analytics & SEO pre-configured", "30-day technical support"],
    deliverables: ["Full Website Blueprint & Code", "Responsive UI Components", "SEO Metadata & OpenGraph Cards", "Hosting & Domain Deployment Guide"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true, placeholder: "Acme Labs" },
      { name: "industry", label: "Industry", kind: "text", required: true, placeholder: "B2B AI Platform" },
      { name: "primary_goal", label: "Primary goal", kind: "select", required: true, options: ["Lead generation", "E-commerce & Checkout", "Product Demo Booking", "Brand Authority"] },
      { name: "brand_colors", label: "Brand colors / aesthetic vibe", kind: "text", placeholder: "Cyber dark with electric cyan accents" },
      { name: "reference_sites", label: "3 reference sites you admire", kind: "textarea", placeholder: "linear.app, stripe.com, vercel.com" },
      { name: "content_brief", label: "Core value proposition & content brief", kind: "textarea", required: true, placeholder: "Describe what your product does and what makes you unique..." },
    ],
  },
  {
    slug: "saas-architecture",
    name: "Full-Stack SaaS Architecture & Specs",
    type: "saas-architecture",
    category: "engineering",
    tier: "one-time",
    priceCents: 34900,
    turnaround: "48 Hours",
    popular: true,
    tagline: "Production-ready system design, DB schemas & API specs",
    description: "Full architectural blueprint covering database ERD, authentication, payment pipelines, and multi-tenant security architecture.",
    features: ["Database ERD & SQL schema", "API specification (REST/GraphQL)", "Stripe billing lifecycle flow", "Vercel/Cloudflare deployment spec"],
    deliverables: ["Postgres Database Schema & Migrations", "API Endpoints Spec & Auth Matrix", "System Architecture Diagram", "Step-by-Step Build Roadmap"],
    intake: [
      { name: "product_concept", label: "SaaS concept / product vision", kind: "textarea", required: true, placeholder: "Explain your SaaS idea, core workflows, and user roles..." },
      { name: "target_users", label: "Target users & volume", kind: "text", required: true, placeholder: "B2B SMBs, approx 10,000 monthly active users" },
      { name: "tech_preferences", label: "Preferred tech stack (optional)", kind: "text", placeholder: "React/Next.js, Supabase/PostgreSQL, Tailwind" },
      { name: "integrations_needed", label: "Required integrations", kind: "textarea", placeholder: "Stripe, OpenAI, SendGrid, GitHub" },
    ],
  },
  {
    slug: "ai-voice-automations",
    name: "AI Voice Agent & Automation Pipeline",
    type: "ai-voice-automations",
    category: "ai",
    tier: "one-time",
    priceCents: 28900,
    turnaround: "3 Days",
    popular: true,
    tagline: "Autonomous voice & workflow pipelines for 24/7 operations",
    description: "Deploy natural voice AI agents hooked into your CRM, database, and scheduling system to handle calls and customer inquiries autonomously.",
    features: ["Inbound/Outbound voice agent script", "n8n / Zapier webhook automation map", "CRM auto-logging triggers", "Live test recording preview"],
    deliverables: ["Conversational Voice Agent Flowchart", "Webhook & Automation Payload Specs", "Vapi / Retell / Twilio Configuration File", "Prompt Engineering Handbook"],
    intake: [
      { name: "business_name", label: "Business name & industry", kind: "text", required: true, placeholder: "Apex Dental / Modern Realty" },
      { name: "call_objective", label: "Primary call objective", kind: "select", required: true, options: ["Appointment Scheduling", "Lead Qualification", "Inbound Customer Support", "Outbound Follow-up"] },
      { name: "crm_software", label: "CRM or tools to connect", kind: "text", required: true, placeholder: "HubSpot, Google Calendar, Airtable" },
      { name: "sample_dialogue", label: "Key questions or dialogue flow", kind: "textarea", required: true, placeholder: "What questions should the bot ask? How should it respond to objections?" },
    ],
  },
  {
    slug: "branding-kit",
    name: "Identity & Branding Kit",
    type: "branding",
    category: "branding",
    tier: "one-time",
    priceCents: 19900,
    turnaround: "48 Hours",
    tagline: "Logo concepts, color palette, typography and guidelines",
    description: "A complete identity system with everything you need to launch a memorable, high-status brand in today's digital market.",
    features: ["Logo marks + responsive variants", "Color palette & type scale", "Brand guidelines handbook", "Social media avatar templates"],
    deliverables: ["Brand Identity Manual (PDF)", "Color Swatches (Hex, RGB, HSL)", "Typography Pairing Guide", "Logo Concept Assets"],
    intake: [
      { name: "brand_name", label: "Brand name", kind: "text", required: true, placeholder: "Veloce Technologies" },
      { name: "industry", label: "Industry", kind: "text", required: true, placeholder: "Fintech / Luxury Commerce" },
      { name: "personality", label: "Brand personality (3-5 adjectives)", kind: "text", required: true, placeholder: "Sleek, authoritative, forward-thinking, effortless" },
      { name: "audience", label: "Target audience", kind: "textarea", required: true, placeholder: "Who is this brand communicating to?" },
      { name: "competitors", label: "Competitors or brands you admire", kind: "textarea", placeholder: "Apple, Stripe, Arc, Linear" },
    ],
  },
  {
    slug: "seo-growth",
    name: "Autonomous SEO Growth Engine",
    type: "seo",
    category: "growth",
    tier: "subscription",
    priceCents: 19900,
    cadence: "/month",
    turnaround: "Ongoing Monthly",
    popular: true,
    tagline: "Compounding organic traffic, on complete autopilot",
    description: "Monthly programmatic content, technical SEO audits, and backlink opportunity pipeline to dominate Google search results.",
    features: ["12 targeted articles / month", "Full technical SEO audit", "Competitor gap analysis", "Keyword rank tracking reports"],
    deliverables: ["Monthly 12-Article Content Matrix", "Internal Linking & Topic Clusters", "Technical Audit Action Checklist"],
    intake: [
      { name: "website_url", label: "Website URL", kind: "url", required: true, placeholder: "https://yourdomain.com" },
      { name: "target_keywords", label: "Target keywords / themes", kind: "textarea", required: true, placeholder: "b2b payment gateway, international settlements" },
      { name: "competitors", label: "Top 3 organic competitors", kind: "textarea", required: true, placeholder: "competitor1.com, competitor2.com" },
      { name: "current_traffic", label: "Current monthly visitors (approx)", kind: "text", placeholder: "e.g. 2,500/mo" },
    ],
  },
  {
    slug: "social-media-kit",
    name: "Social Media Content Matrix (30 Days)",
    type: "social",
    category: "growth",
    tier: "one-time",
    priceCents: 14900,
    turnaround: "24 Hours",
    tagline: "30 days of scroll-stopping captions, hooks & carousels",
    description: "A 30-post content calendar generated from your brand voice — high-engagement hooks, value-dense captions, and hashtag strategies.",
    features: ["30 custom posts (hook + body + CTA)", "Hashtag clusters & sound trends", "Optimal publishing schedule", "Content repurposing framework"],
    deliverables: ["30-Day Content Spreadsheet", "Hook Library (50+ Viral Openers)", "Carousel Script Templates"],
    intake: [
      { name: "brand_name", label: "Brand name", kind: "text", required: true, placeholder: "NextGen AI" },
      { name: "platforms", label: "Target platforms", kind: "select", required: true, options: ["LinkedIn & Twitter/X", "Instagram & TikTok", "Multi-platform (All 4)"] },
      { name: "voice", label: "Voice & tone", kind: "text", required: true, placeholder: "Bold, intellectual, no-fluff, contrarian" },
      { name: "audience", label: "Target audience", kind: "textarea", required: true, placeholder: "Founders, CTOs, Angel Investors" },
      { name: "pillars", label: "Content pillars (3-5 key topics)", kind: "textarea", required: true, placeholder: "1. AI workflows, 2. Engineering culture, 3. Founder lessons" },
    ],
  },
  {
    slug: "ad-copy-pack",
    name: "High-Converting Ad Copy & Creative Pack",
    type: "adcopy",
    category: "growth",
    tier: "one-time",
    priceCents: 9900,
    turnaround: "24 Hours",
    tagline: "12 battle-tested ad variants ready to run",
    description: "Twelve high-converting ad variants for Meta, Google, and LinkedIn, built on proven direct-response conversion frameworks.",
    features: ["12 distinct angle variants", "Meta & Google Ads formats", "Scroll-stopping headlines", "A/B test testing matrix"],
    deliverables: ["Ad Copy Matrix (Headlines, Hooks, Bodies, CTAs)", "Angle Hypotheses & Audience Targeting Notes"],
    intake: [
      { name: "product_name", label: "Product / offer name", kind: "text", required: true, placeholder: "ScaleFlow SaaS" },
      { name: "value_prop", label: "Core value proposition", kind: "textarea", required: true, placeholder: "Save 15 hours weekly on client onboarding..." },
      { name: "audience", label: "Target audience & pain points", kind: "textarea", required: true, placeholder: "Agency owners struggling with slow onboarding..." },
      { name: "objection", label: "Top customer objection", kind: "text", placeholder: "'We already use spreadsheets' or 'Too expensive'" },
      { name: "platform", label: "Primary advertising channel", kind: "select", required: true, options: ["Meta (FB/IG)", "Google Search/Display", "LinkedIn Ads", "Multi-channel"] },
    ],
  },
  {
    slug: "email-sequence",
    name: "Behavioral Email Sequence & Nurture Funnel",
    type: "email",
    category: "growth",
    tier: "one-time",
    priceCents: 12900,
    turnaround: "24 Hours",
    tagline: "A 7-email high-conversion nurture sequence",
    description: "A complete welcome and sales sequence engineered to turn cold subscribers into paying, enthusiastic customers.",
    features: ["7 automated emails (Subject + Preview + Body)", "Psychological Welcome → Nurture → Close arc", "Plain-text & HTML suggestions", "Automation trigger logic"],
    deliverables: ["7-Part Email Sequence Document", "Subject Line A/B Test Options", "Trigger Flowchart (Day 0 to Day 14)"],
    intake: [
      { name: "business_name", label: "Business or product name", kind: "text", required: true, placeholder: "CloudSentry" },
      { name: "audience", label: "Subscriber persona", kind: "textarea", required: true, placeholder: "Engineering leads who downloaded our free security audit checklist..." },
      { name: "offer", label: "Core offer being sold", kind: "textarea", required: true, placeholder: "CloudSentry Pro plan at $79/mo with 14-day trial" },
      { name: "tone", label: "Tone & writing style", kind: "text", placeholder: "Warm, witty, direct, highly conversational" },
    ],
  },
  {
    slug: "chatbot-script",
    name: "Conversational Chatbot Intent & Response Tree",
    type: "chatbot",
    category: "ai",
    tier: "one-time",
    priceCents: 8900,
    turnaround: "24 Hours",
    tagline: "Plug-and-play support bot dialogue & logic tree",
    description: "A comprehensive intent and response tree your team can immediately drop into Intercom, Drift, Zendesk, or custom AI bots.",
    features: ["20+ core intents mapped", "Graceful fallback & routing flows", "Human escalation triggers", "Clean JSON/CSV export format"],
    deliverables: ["Dialogue Intent Tree (Markdown & JSON)", "Edge Case & Error Handling Scripts"],
    intake: [
      { name: "business_name", label: "Business name", kind: "text", required: true, placeholder: "FinFlow Solutions" },
      { name: "use_case", label: "Primary bot use case", kind: "select", required: true, options: ["Customer Support Triage", "Sales Lead Qualification", "Demo & Booking Automation", "Product Onboarding"] },
      { name: "faqs", label: "Top 5 FAQs to answer", kind: "textarea", required: true, placeholder: "Pricing, refund policy, integrations, uptime, how to get started" },
      { name: "voice", label: "Bot persona & voice", kind: "text", placeholder: "Helpful, ultra-fast, professional yet friendly" },
    ],
  },
  {
    slug: "investor-pitch-deck",
    name: "Venture Pitch Deck (12-Slide YC/Sequoia Blueprint)",
    type: "pitchdeck",
    category: "strategy",
    tier: "one-time",
    priceCents: 17900,
    turnaround: "48 Hours",
    popular: true,
    tagline: "A 12-slide narrative blueprint venture capitalists actually read",
    description: "Slide-by-slide narrative blueprint engineered around the battle-tested Y Combinator and Sequoia investor frameworks.",
    features: ["12 structured narrative slides", "Word-for-word speaker notes", "TAM / SAM / SOM market framing", "Cap-table & fundraising ask clarity"],
    deliverables: ["12-Slide Deck Blueprint & Content", "VC Q&A Preparation Cheat Sheet", "Slide Visual Layout Recommendations"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true, placeholder: "Aura Health AI" },
      { name: "stage", label: "Target funding stage", kind: "select", required: true, options: ["Pre-seed ($250k - $750k)", "Seed ($1M - $3M)", "Series A ($5M - $12M)", "Bridge / Growth"] },
      { name: "raise_amount", label: "Target raise amount", kind: "text", required: true, placeholder: "$1.5M on a SAFE" },
      { name: "problem", label: "The urgent problem you solve", kind: "textarea", required: true, placeholder: "Clinics lose 30% of revenue due to manual billing errors..." },
      { name: "solution", label: "Your product & secret sauce", kind: "textarea", required: true, placeholder: "Real-time AI claims verification reducing rejection to < 1%..." },
      { name: "traction", label: "Current traction, MRR & key metrics", kind: "textarea", required: true, placeholder: "14 pilot clinics, $22k MRR, 18% MoM growth..." },
      { name: "market", label: "Market size & dynamics", kind: "textarea", required: true, placeholder: "Global healthcare claims processing is a $42B annual market..." },
    ],
  },
  {
    slug: "business-plan",
    name: "Investor & Bank-Ready Operating Business Plan",
    type: "bizplan",
    category: "strategy",
    tier: "one-time",
    priceCents: 22900,
    turnaround: "3 Days",
    tagline: "Bank-ready, investor-grade comprehensive business plan",
    description: "A complete operational plan complete with executive summary, market analysis, financial projections, and go-to-market strategy.",
    features: ["Executive summary & mission", "Deep competitive landscape", "Operations & GTM playbook", "3-Year financial forecast outline"],
    deliverables: ["Full Business Plan Document (PDF & Word)", "Financial Projections Model Template", "Executive Pitch Summary"],
    intake: [
      { name: "business_name", label: "Business name & industry", kind: "text", required: true, placeholder: "Urban Logistics Inc" },
      { name: "industry", label: "Industry & geography", kind: "text", required: true, placeholder: "Last-mile delivery, North America" },
      { name: "model", label: "Core business & revenue model", kind: "textarea", required: true, placeholder: "Per-mile subscription + surge fee for guaranteed 30-minute delivery" },
      { name: "audience", label: "Target clients", kind: "textarea", required: true, placeholder: "Local retail brands, pharmacies, grocery chains" },
      { name: "revenue_streams", label: "Projected revenue streams", kind: "textarea", required: true, placeholder: "Subscription tiers, volume rebates, premium SLA tier" },
      { name: "milestones", label: "Key 12-month milestones", kind: "textarea", placeholder: "Launch 3 cities, sign 50 merchant partners, reach break-even" },
    ],
  },
  {
    slug: "naming-pack",
    name: "Product & Company Naming Pack",
    type: "naming",
    category: "branding",
    tier: "one-time",
    priceCents: 6900,
    turnaround: "24 Hours",
    tagline: "10 brandable names with positioning rationale & domain checks",
    description: "Ten distinctive, memorable name candidates engineered for category leadership, with positioning rationale and domain availability flags.",
    features: ["10 distinctive candidate names", "Strategic rationale per name", "Domain & handle availability cues", "Trademark risk assessment hints"],
    deliverables: ["Naming Dossier with 10 Candidates", "Phonetic & Etymology Breakdown", "Domain Recommendation Matrix"],
    intake: [
      { name: "category", label: "Product category", kind: "text", required: true, placeholder: "B2B AI Data Pipeline / Luxury Wellness" },
      { name: "audience", label: "Target audience", kind: "textarea", required: true, placeholder: "Forward-thinking tech founders and high-income consumers" },
      { name: "personality", label: "Brand tone & vibe", kind: "text", required: true, placeholder: "Short, punchy, neo-futuristic, memorable" },
      { name: "must_avoid", label: "Words or themes to avoid", kind: "textarea", placeholder: "No overused suffixes like -ly, -ify, or generic terms" },
    ],
  },
  {
    slug: "linkedin-optimization",
    name: "Executive LinkedIn Profile Optimization",
    type: "linkedin",
    category: "strategy",
    tier: "one-time",
    priceCents: 4900,
    turnaround: "24 Hours",
    tagline: "Recruiter-magnet profile rewrite for leaders and founders",
    description: "Complete profile rewrite — headline, story-driven About section, quantified experience bullets, and search keyword strategy.",
    features: ["3 Headline variants (Authority, Founder, Recruiter)", "Story-driven About summary", "Quantified experience rewrites", "Featured section & banner blueprint"],
    deliverables: ["LinkedIn Rewrite Document", "3 Custom Headline Formats", "Connection Request Outreach Templates"],
    intake: [
      { name: "full_name", label: "Full name & current title", kind: "text", required: true, placeholder: "Elena Rostova, VP of Growth" },
      { name: "target_role", label: "Target role or founder objective", kind: "text", required: true, placeholder: "Chief Growth Officer or Seed-stage advisor roles" },
      { name: "industry", label: "Industry & domain expertise", kind: "text", required: true, placeholder: "Consumer Fintech / Marketplace" },
      { name: "current_profile", label: "Paste current profile text / resume", kind: "textarea", required: true, placeholder: "Paste current headline, about, and jobs..." },
      { name: "differentiators", label: "What makes your career unique", kind: "textarea", required: true, placeholder: "Led $0 to $20M scale twice, deep expertise in viral growth loops..." },
    ],
  },
  {
    slug: "press-release",
    name: "AP-Style Press Release & Media PR Pitch",
    type: "pressrelease",
    category: "growth",
    tier: "one-time",
    priceCents: 7900,
    turnaround: "24 Hours",
    tagline: "Newsroom-ready AP release plus tailored journalist pitch",
    description: "AP-style press release plus a tailored media pitch email engineered to earn genuine journalist attention and organic news coverage.",
    features: ["AP-standard press release", "Impactful executive quotes", "Boilerplate & media contact", "Direct journalist outreach pitch email"],
    deliverables: ["Newsroom-Formatted Press Release", "Journalist Pitch Email Script", "Target Media Outlet Recommendations"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true, placeholder: "Straxon Digital" },
      { name: "announcement", label: "What are you announcing?", kind: "textarea", required: true, placeholder: "Launching the autonomous digital agency engine..." },
      { name: "key_facts", label: "Key facts, figures & dates", kind: "textarea", required: true, placeholder: "Available worldwide Sept 1, 10x faster turnaround, $500k in pilot ARR" },
      { name: "spokesperson", label: "Spokesperson name & title", kind: "text", required: true, placeholder: "Alex Rivera, Founder & CEO" },
      { name: "quote_angle", label: "Key message to emphasize in quote", kind: "text", placeholder: "Democratizing elite agency speed for ambitious operators everywhere" },
    ],
  },
  {
    slug: "notion-os",
    name: "Founder OS Notion Template & Setup",
    type: "template",
    category: "engineering",
    tier: "digital",
    priceCents: 4900,
    turnaround: "Instant Download",
    tagline: "The all-in-one company operating system used by Straxon",
    description: "An instantly downloadable Notion company operating system with task management, CRM, product roadmaps, and content engines.",
    features: ["Instant duplicate link", "Lifetime updates included", "15-minute video walkthrough", "Pre-configured dashboards & databases"],
    deliverables: ["Full Notion Workspace Duplicate Link", "Video Setup & Best Practices Guide", "Customizable KPI Dashboard"],
    intake: [
      { name: "delivery_email", label: "Delivery email address", kind: "email", required: true, placeholder: "founder@company.com" },
    ],
  },
];

export const findService = (slug: string) => SERVICES.find((s) => s.slug === slug);

export interface ServiceBundle {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  popular?: boolean;
  bundlePriceCents: number;
  originalPriceCents: number;
  savingsCents: number;
  cadence?: string;
  turnaround: string;
  includedServiceSlugs: string[];
  highlights: string[];
}

export const BUNDLES: ServiceBundle[] = [
  {
    slug: "startup-empire-bundle",
    name: "Startup Launch Empire Suite",
    tagline: "The complete turnkey launch stack for founders and emerging ventures",
    description:
      "Everything required to launch with authority: high-converting 7-page site, complete brand identity manual, 12-slide YC/Sequoia pitch deck, and 30 days of viral launch content.",
    badge: "SAVE $501 (BEST VALUE)",
    popular: true,
    bundlePriceCents: 89900,
    originalPriceCents: 140000,
    savingsCents: 50100,
    turnaround: "5-7 Business Days",
    includedServiceSlugs: [
      "conversion-website",
      "branding-kit",
      "investor-pitch-deck",
      "social-media-kit",
    ],
    highlights: [
      "7-Page Conversion Website Blueprint & Code",
      "Complete Brand Identity Manual & Vectors",
      "Venture Pitch Deck (12-Slide VC Framework)",
      "30-Day Launch Content Calendar & Hooks",
      "Priority Engineering Queue + 1-on-1 Consultation",
    ],
  },
  {
    slug: "executive-career-suite",
    name: "Executive Career Acceleration Suite",
    tagline: "Land your next VP or C-Level role with undeniable authority",
    description:
      "A complete executive career makeover: recruiter-grade ATS resume, story-driven LinkedIn profile rewrite, tailored cover letter, and a 1-on-1 career strategy session.",
    badge: "SAVE $121",
    popular: true,
    bundlePriceCents: 19900,
    originalPriceCents: 32000,
    savingsCents: 12100,
    turnaround: "24-48 Hours",
    includedServiceSlugs: [
      "executive-resume",
      "linkedin-optimization",
    ],
    highlights: [
      "ATS-Beating Executive Resume (PDF + DOCX)",
      "Executive LinkedIn Profile Rewrite (3 Headlines)",
      "Targeted Strategic Cover Letter",
      "45-Min 1-on-1 Career Strategy Consultation",
    ],
  },
  {
    slug: "autonomous-growth-retainer",
    name: "Autonomous Growth & SEO Retainer",
    tagline: "Compounding organic traffic, social reach, and automated workflows on autopilot",
    description:
      "Our premier ongoing growth package: 12 targeted monthly SEO articles, 30 days of social content, and 100 recurring AI automation credits.",
    badge: "SAVE $191/MO",
    bundlePriceCents: 29900,
    originalPriceCents: 49000,
    savingsCents: 19100,
    cadence: "/month",
    turnaround: "Continuous Monthly",
    includedServiceSlugs: [
      "seo-growth",
      "social-media-kit",
    ],
    highlights: [
      "12 Monthly Targeted SEO Growth Articles",
      "30 Scroll-Stopping Social Posts (Multi-Platform)",
      "100 Monthly AI Automation Credits",
      "Zapier / Make / n8n Webhook Auto-Dispatch",
    ],
  },
];

export const findBundle = (slug: string) => BUNDLES.find((b) => b.slug === slug);

export interface PromoCode {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  description: string;
}

export const PROMO_CODES: Record<string, PromoCode> = {
  LAUNCH25: {
    code: "LAUNCH25",
    discountType: "percentage",
    discountValue: 25,
    description: "Launch Week Special: 25% Off Entire Order",
  },
  FOUNDER50: {
    code: "FOUNDER50",
    discountType: "fixed",
    discountValue: 5000,
    description: "Founder Welcome Credit: $50 Off",
  },
  VIP20: {
    code: "VIP20",
    discountType: "percentage",
    discountValue: 20,
    description: "VIP Executive Discount: 20% Off",
  },
};

export interface OrderBump {
  id: string;
  title: string;
  tagline: string;
  priceCents: number;
  originalPriceCents: number;
  description: string;
  badge: string;
}

export const ORDER_BUMPS: OrderBump[] = [
  {
    id: "bump-repurpose",
    title: "⚡ Multi-Platform Content Repurposing Pack",
    tagline: "Turn your deliverable into 5 formats instantly",
    priceCents: 2900,
    originalPriceCents: 9900,
    description: "Our engine automatically reformats your deliverable into newsletter blurbs, LinkedIn carousel slides, and executive talking points.",
    badge: "70% OFF ONE-TIME",
  },
  {
    id: "bump-vip-qa",
    title: "🛡️ VIP Senior Operator Manual Review & Fast-Track",
    tagline: "Manual review by a senior Straxon operator",
    priceCents: 3900,
    originalPriceCents: 7900,
    description: "A human senior agency lead reviews and fine-tunes your generated deliverable before final release, ensuring 100% polish.",
    badge: "HIGH VALUE",
  },
];

export const formatPrice = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export function applyDiscount(
  totalCents: number,
  codeString?: string
): { finalCents: number; discountCents: number; promo: PromoCode | null } {
  if (!codeString) return { finalCents: totalCents, discountCents: 0, promo: null };
  const codeUpper = codeString.trim().toUpperCase();
  const promo = PROMO_CODES[codeUpper] || null;
  if (!promo) return { finalCents: totalCents, discountCents: 0, promo: null };

  let discountCents = 0;
  if (promo.discountType === "percentage") {
    discountCents = Math.round(totalCents * (promo.discountValue / 100));
  } else {
    discountCents = Math.min(totalCents, promo.discountValue);
  }

  return {
    finalCents: Math.max(0, totalCents - discountCents),
    discountCents,
    promo,
  };
}

export function calculateCustomPrice(
  baseCents: number,
  tier: PackageTier = "starter",
  selectedAddonIds: string[] = [],
  addons: ServiceAddon[] = GLOBAL_ADDONS
): { totalCents: number; tierCents: number; addonsCents: number } {
  const tierConfig = PACKAGE_TIERS[tier] || PACKAGE_TIERS.starter;
  const tierCents = Math.round(baseCents * tierConfig.multiplier);
  
  const addonsCents = selectedAddonIds.reduce((sum, addonId) => {
    const found = addons.find((a) => a.id === addonId);
    return sum + (found ? found.priceCents : 0);
  }, 0);

  return {
    totalCents: tierCents + addonsCents,
    tierCents,
    addonsCents,
  };
}

