// Strict TypeScript contracts + runtime Zod validators for generated deliverables.
// These are the SINGLE source of truth used by the edge function (output schema)
// and the React renderer (input props). Keep them in sync.

import { z } from "zod";

export type DeliverableKind =
  | "resume"
  | "branding"
  | "website"
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

// ---------- Zod schemas ----------

export const ResumeSchema = z.object({
  kind: z.literal("resume"),
  name: z.string().min(1),
  title: z.string().min(1),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  summary: z.string().min(1),
  skills: z.array(z.string()).min(1),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string(),
      highlights: z.array(z.string()).min(1),
    }),
  ).min(1),
  education: z.array(
    z.object({ school: z.string(), degree: z.string(), year: z.string() }),
  ),
});

export const BrandKitSchema = z.object({
  kind: z.literal("branding"),
  brand_name: z.string(),
  tagline: z.string(),
  mission: z.string(),
  voice: z.array(z.string()).min(1),
  palette: z.array(
    z.object({ name: z.string(), hex: z.string(), usage: z.string() }),
  ).min(1),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
    rationale: z.string(),
  }),
  logo_concept: z.string(),
  do_dont: z.object({
    dos: z.array(z.string()).min(1),
    donts: z.array(z.string()).min(1),
  }),
});

export const WebsiteSchema = z.object({
  kind: z.literal("website"),
  site_name: z.string(),
  tagline: z.string(),
  pages: z.array(
    z.object({
      slug: z.string(),
      purpose: z.string(),
      sections: z.array(z.string()).min(1),
    }),
  ).min(1),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta: z.string(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).min(1),
  }),
});

export const SeoSchema = z.object({
  kind: z.literal("seo"),
  audit_summary: z.string(),
  target_keywords: z.array(
    z.object({
      keyword: z.string(),
      volume: z.string(),
      difficulty: z.string(),
      intent: z.string(),
    }),
  ).min(1),
  content_plan: z.array(
    z.object({ title: z.string(), angle: z.string(), cluster: z.string() }),
  ).min(1),
  technical_recommendations: z.array(z.string()).min(1),
});

export const TemplateSchema = z.object({
  kind: z.literal("template"),
  product_name: z.string(),
  download_instructions: z.string(),
  features: z.array(z.string()).min(1),
});

export const SocialSchema = z.object({
  kind: z.literal("social"),
  brand_name: z.string(),
  pillars: z.array(z.string()).min(1),
  posts: z.array(
    z.object({
      day: z.number(),
      pillar: z.string(),
      hook: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      cta: z.string(),
    }),
  ).min(1),
});

export const AdCopySchema = z.object({
  kind: z.literal("adcopy"),
  product_name: z.string(),
  ads: z.array(
    z.object({
      angle: z.string(),
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
    }),
  ).min(1),
});

export const EmailSchema = z.object({
  kind: z.literal("email"),
  business_name: z.string(),
  emails: z.array(
    z.object({
      step: z.number(),
      day: z.string(),
      subject: z.string(),
      preview: z.string(),
      body: z.string(),
    }),
  ).min(1),
});

export const ChatbotSchema = z.object({
  kind: z.literal("chatbot"),
  business_name: z.string(),
  intents: z.array(
    z.object({
      name: z.string(),
      examples: z.array(z.string()),
      response: z.string(),
      followups: z.array(z.string()).optional(),
    }),
  ).min(1),
  fallback: z.string(),
});

export const PitchDeckSchema = z.object({
  kind: z.literal("pitchdeck"),
  company_name: z.string(),
  stage: z.string(),
  raise_amount: z.string(),
  slides: z.array(
    z.object({
      number: z.number(),
      title: z.string(),
      headline: z.string(),
      bullets: z.array(z.string()).min(1),
      speaker_notes: z.string(),
    }),
  ).min(1),
});

export const BizPlanSchema = z.object({
  kind: z.literal("bizplan"),
  business_name: z.string(),
  executive_summary: z.string(),
  market_analysis: z.string(),
  competitive_landscape: z.string(),
  business_model: z.string(),
  go_to_market: z.string(),
  operations_plan: z.string(),
  financial_outline: z.array(
    z.object({ year: z.string(), revenue: z.string(), costs: z.string(), notes: z.string() }),
  ).min(1),
  milestones: z.array(z.string()).min(1),
});

export const NamingSchema = z.object({
  kind: z.literal("naming"),
  category: z.string(),
  names: z.array(
    z.object({
      name: z.string(),
      rationale: z.string(),
      domain_hint: z.string(),
      trademark_risk: z.string(),
    }),
  ).min(1),
});

export const LinkedInSchema = z.object({
  kind: z.literal("linkedin"),
  full_name: z.string(),
  headline_options: z.array(z.string()).min(1),
  about: z.string(),
  experience_bullets: z.array(
    z.object({ role: z.string(), bullets: z.array(z.string()).min(1) }),
  ).min(1),
  skills: z.array(z.string()).min(1),
});

export const PressReleaseSchema = z.object({
  kind: z.literal("pressrelease"),
  company_name: z.string(),
  release: z.object({
    headline: z.string(),
    subhead: z.string(),
    dateline: z.string(),
    body: z.string(),
    quote: z.string(),
    boilerplate: z.string(),
  }),
  media_pitch: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  suggested_outlets: z.array(z.string()).min(1),
});

export const DeliverableSchema = z.discriminatedUnion("kind", [
  ResumeSchema,
  BrandKitSchema,
  WebsiteSchema,
  SeoSchema,
  TemplateSchema,
  SocialSchema,
  AdCopySchema,
  EmailSchema,
  ChatbotSchema,
  PitchDeckSchema,
  BizPlanSchema,
  NamingSchema,
  LinkedInSchema,
  PressReleaseSchema,
]);

// ---------- TypeScript types (inferred) ----------

export type IResumeData = z.infer<typeof ResumeSchema>;
export type IBrandKitData = z.infer<typeof BrandKitSchema>;
export type IWebsiteData = z.infer<typeof WebsiteSchema>;
export type ISeoData = z.infer<typeof SeoSchema>;
export type ITemplateData = z.infer<typeof TemplateSchema>;
export type ISocialData = z.infer<typeof SocialSchema>;
export type IAdCopyData = z.infer<typeof AdCopySchema>;
export type IEmailData = z.infer<typeof EmailSchema>;
export type IChatbotData = z.infer<typeof ChatbotSchema>;
export type IPitchDeckData = z.infer<typeof PitchDeckSchema>;
export type IBizPlanData = z.infer<typeof BizPlanSchema>;
export type INamingData = z.infer<typeof NamingSchema>;
export type ILinkedInData = z.infer<typeof LinkedInSchema>;
export type IPressReleaseData = z.infer<typeof PressReleaseSchema>;
export type DeliverableContent = z.infer<typeof DeliverableSchema>;

/** Safe-parse arbitrary input into a typed deliverable, returning null on failure. */
export function parseDeliverable(input: unknown): DeliverableContent | null {
  if (!input || typeof input !== "object") return null;
  const result = DeliverableSchema.safeParse(input);
  return result.success ? result.data : null;
}
