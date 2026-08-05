// Central catalog: any new services added here automatically flow through
// services page, marketplace, checkout, and admin labelling.

export type ServiceTier = "one-time" | "subscription" | "digital";

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
  | "pressrelease";

export interface ServiceDef {
  slug: string;
  name: string;
  type: ServiceType;
  tier: ServiceTier;
  priceCents: number;
  cadence?: string;
  tagline: string;
  description: string;
  features: string[];
  intake: IntakeField[];
}

export interface IntakeField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "email" | "url" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export const SERVICES: ServiceDef[] = [
  {
    slug: "executive-resume",
    name: "Executive Resume",
    type: "resume",
    tier: "one-time",
    priceCents: 2900,
    tagline: "ATS-beating, recruiter-tested resume in 24h",
    description:
      "Our automation engine reverse-engineers job descriptions and crafts a recruiter-grade resume tuned to land interviews.",
    features: ["ATS keyword optimization", "PDF + DOCX delivery", "Cover letter included", "1 free revision"],
    intake: [
      { name: "target_role", label: "Target role", kind: "text", required: true, placeholder: "Senior Product Manager" },
      { name: "industry", label: "Industry", kind: "text", required: true, placeholder: "SaaS / Fintech" },
      { name: "experience_years", label: "Years of experience", kind: "text", required: true },
      { name: "current_resume", label: "Paste your current resume / LinkedIn", kind: "textarea", required: true },
      { name: "achievements", label: "Top 3 achievements", kind: "textarea", required: true },
    ],
  },
  {
    slug: "conversion-website",
    name: "Conversion Website",
    type: "website",
    tier: "one-time",
    priceCents: 49900,
    tagline: "A 7-page conversion machine, shipped in 7 days",
    description: "Cyber-luxury landing built on the Straxon stack — animated, responsive, and SEO-ready out of the box.",
    features: ["7 custom pages", "Mobile-first responsive", "Analytics + SEO", "30-day support"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true },
      { name: "industry", label: "Industry", kind: "text", required: true },
      { name: "primary_goal", label: "Primary goal", kind: "select", required: true, options: ["Lead generation", "E-commerce", "Booking", "Brand awareness"] },
      { name: "brand_colors", label: "Brand colors / vibe", kind: "text" },
      { name: "reference_sites", label: "3 reference sites you love", kind: "textarea" },
      { name: "content_brief", label: "Content brief", kind: "textarea", required: true },
    ],
  },
  {
    slug: "branding-kit",
    name: "Identity & Branding Kit",
    type: "branding",
    tier: "one-time",
    priceCents: 19900,
    tagline: "Logo, palette, type, and brand guidelines",
    description: "A complete identity system with everything you need to launch a memorable brand.",
    features: ["Logo + variants", "Color & type system", "Brand guidelines PDF", "Social templates"],
    intake: [
      { name: "brand_name", label: "Brand name", kind: "text", required: true },
      { name: "industry", label: "Industry", kind: "text", required: true },
      { name: "personality", label: "Brand personality (3-5 words)", kind: "text", required: true },
      { name: "audience", label: "Target audience", kind: "textarea", required: true },
      { name: "competitors", label: "Competitors / inspirations", kind: "textarea" },
    ],
  },
  {
    slug: "seo-growth",
    name: "SEO Growth Engine",
    type: "seo",
    tier: "subscription",
    priceCents: 19900,
    cadence: "/month",
    tagline: "Compounding organic traffic, on autopilot",
    description: "Monthly content, technical SEO, and backlink building powered by our automated growth pipeline.",
    features: ["12 articles / month", "Technical SEO audits", "Backlink outreach", "Live ranking dashboard"],
    intake: [
      { name: "website_url", label: "Website URL", kind: "url", required: true },
      { name: "target_keywords", label: "Target keywords", kind: "textarea", required: true },
      { name: "competitors", label: "Top 3 competitors", kind: "textarea", required: true },
      { name: "current_traffic", label: "Current monthly traffic (approx)", kind: "text" },
    ],
  },
  {
    slug: "social-media-kit",
    name: "Social Media Content Kit",
    type: "social",
    tier: "one-time",
    priceCents: 14900,
    tagline: "30 days of scroll-stopping captions & hooks",
    description: "A 30-post content calendar generated from your brand voice — captions, hooks, hashtags, and posting schedule.",
    features: ["30 posts (caption + hook)", "Hashtag clusters", "Posting schedule", "Repurposing matrix"],
    intake: [
      { name: "brand_name", label: "Brand name", kind: "text", required: true },
      { name: "platforms", label: "Target platforms", kind: "select", required: true, options: ["Instagram", "LinkedIn", "X / Twitter", "TikTok", "Multi-platform"] },
      { name: "voice", label: "Voice & tone", kind: "text", required: true, placeholder: "Bold, witty, expert" },
      { name: "audience", label: "Target audience", kind: "textarea", required: true },
      { name: "pillars", label: "Content pillars (3-5)", kind: "textarea", required: true },
    ],
  },
  {
    slug: "ad-copy-pack",
    name: "Ad Copy Pack",
    type: "adcopy",
    tier: "one-time",
    priceCents: 9900,
    tagline: "12 high-converting ads, ready to ship",
    description: "Twelve battle-tested ad variants for Meta and Google, crafted around proven conversion frameworks.",
    features: ["12 unique ad variants", "Meta + Google ready", "Headline + body + CTA", "A/B test matrix"],
    intake: [
      { name: "product_name", label: "Product / offer", kind: "text", required: true },
      { name: "value_prop", label: "Core value proposition", kind: "textarea", required: true },
      { name: "audience", label: "Target audience", kind: "textarea", required: true },
      { name: "objection", label: "Top objection to overcome", kind: "text" },
      { name: "platform", label: "Primary platform", kind: "select", required: true, options: ["Meta", "Google", "LinkedIn", "Multi-channel"] },
    ],
  },
  {
    slug: "email-sequence",
    name: "Email Sequence Engine",
    type: "email",
    tier: "one-time",
    priceCents: 12900,
    tagline: "A 7-email nurture flow that converts",
    description: "A complete welcome / nurture sequence engineered to move cold leads to paying customers.",
    features: ["7 emails (subject + body)", "Welcome → pitch → close arc", "Plain-text variants", "Automation map"],
    intake: [
      { name: "business_name", label: "Business name", kind: "text", required: true },
      { name: "audience", label: "Subscriber persona", kind: "textarea", required: true },
      { name: "offer", label: "Primary offer", kind: "textarea", required: true },
      { name: "tone", label: "Tone", kind: "text", placeholder: "Warm, direct, no fluff" },
    ],
  },
  {
    slug: "chatbot-script",
    name: "Conversational Chatbot Script",
    type: "chatbot",
    tier: "one-time",
    priceCents: 8900,
    tagline: "Plug-and-play support bot dialogue",
    description: "A structured intent / response tree your team can drop into Intercom, Drift, or any chat platform.",
    features: ["20+ intents mapped", "Fallback flows", "Handoff triggers", "JSON export"],
    intake: [
      { name: "business_name", label: "Business name", kind: "text", required: true },
      { name: "use_case", label: "Primary use case", kind: "select", required: true, options: ["Customer support", "Sales qualification", "Booking", "Onboarding"] },
      { name: "faqs", label: "Top FAQs (one per line)", kind: "textarea", required: true },
      { name: "voice", label: "Bot personality", kind: "text" },
    ],
  },
  {
    slug: "investor-pitch-deck",
    name: "Investor Pitch Deck",
    type: "pitchdeck",
    tier: "one-time",
    priceCents: 17900,
    tagline: "A 12-slide deck VCs actually read",
    description:
      "Slide-by-slide narrative blueprint engineered around the proven YC / Sequoia investor frameworks.",
    features: ["12 structured slides", "Speaker notes", "TAM/SAM/SOM framing", "Cap-table ready"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true },
      { name: "stage", label: "Funding stage", kind: "select", required: true, options: ["Pre-seed", "Seed", "Series A", "Series B+"] },
      { name: "raise_amount", label: "Raise amount", kind: "text", required: true, placeholder: "$1.5M" },
      { name: "problem", label: "Problem you solve", kind: "textarea", required: true },
      { name: "solution", label: "Your solution", kind: "textarea", required: true },
      { name: "traction", label: "Traction & metrics", kind: "textarea", required: true },
      { name: "market", label: "Market size & opportunity", kind: "textarea", required: true },
    ],
  },
  {
    slug: "business-plan",
    name: "Business Plan",
    type: "bizplan",
    tier: "one-time",
    priceCents: 22900,
    tagline: "Bank-ready, investor-grade business plan",
    description:
      "A complete operating plan with executive summary, market analysis, financials, and go-to-market.",
    features: ["Executive summary", "Market & competitive analysis", "GTM + ops plan", "3-year financial outline"],
    intake: [
      { name: "business_name", label: "Business name", kind: "text", required: true },
      { name: "industry", label: "Industry", kind: "text", required: true },
      { name: "model", label: "Business model", kind: "textarea", required: true },
      { name: "audience", label: "Target audience", kind: "textarea", required: true },
      { name: "revenue_streams", label: "Revenue streams", kind: "textarea", required: true },
      { name: "milestones", label: "12-month milestones", kind: "textarea" },
    ],
  },
  {
    slug: "naming-pack",
    name: "Product Naming Pack",
    type: "naming",
    tier: "one-time",
    priceCents: 6900,
    tagline: "10 brandable names with rationale & domains",
    description:
      "Ten distinctive name candidates engineered for memorability, with positioning rationale and domain checks.",
    features: ["10 unique names", "Rationale per name", "Domain availability hints", "Trademark risk flags"],
    intake: [
      { name: "category", label: "Product category", kind: "text", required: true, placeholder: "B2B SaaS analytics" },
      { name: "audience", label: "Target audience", kind: "textarea", required: true },
      { name: "personality", label: "Brand personality (3-5 words)", kind: "text", required: true },
      { name: "must_avoid", label: "Words / themes to avoid", kind: "textarea" },
    ],
  },
  {
    slug: "linkedin-optimization",
    name: "LinkedIn Profile Optimization",
    type: "linkedin",
    tier: "one-time",
    priceCents: 4900,
    tagline: "Recruiter-magnet LinkedIn rewrite",
    description:
      "Complete profile rewrite — headline, about, experience bullets, and skills — tuned for your target role.",
    features: ["Headline (3 variants)", "About section", "Experience bullets", "Skills & keywords"],
    intake: [
      { name: "full_name", label: "Full name", kind: "text", required: true },
      { name: "target_role", label: "Target role", kind: "text", required: true },
      { name: "industry", label: "Industry", kind: "text", required: true },
      { name: "current_profile", label: "Paste current profile / resume", kind: "textarea", required: true },
      { name: "differentiators", label: "What makes you different", kind: "textarea", required: true },
    ],
  },
  {
    slug: "press-release",
    name: "Press Release Pack",
    type: "pressrelease",
    tier: "one-time",
    priceCents: 7900,
    tagline: "Newsroom-ready press release & media pitch",
    description:
      "AP-style press release plus a tailored media pitch email — ready to send to journalists.",
    features: ["AP-style release", "Boilerplate", "Media pitch email", "Suggested outlets"],
    intake: [
      { name: "company_name", label: "Company name", kind: "text", required: true },
      { name: "announcement", label: "What are you announcing?", kind: "textarea", required: true },
      { name: "key_facts", label: "Key facts / numbers", kind: "textarea", required: true },
      { name: "spokesperson", label: "Spokesperson name & title", kind: "text", required: true },
      { name: "quote_angle", label: "Quote angle", kind: "text" },
    ],
  },
  {
    slug: "notion-os",
    name: "Founder OS Template",
    type: "template",
    tier: "digital",
    priceCents: 4900,
    tagline: "The all-in-one operating system used by Straxon",
    description: "An instantly downloadable Notion template + setup guide for ambitious operators.",
    features: ["Lifetime access", "Free updates", "Setup video", "Community access"],
    intake: [
      { name: "delivery_email", label: "Delivery email", kind: "email", required: true },
    ],
  },
];

export const findService = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const formatPrice = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
