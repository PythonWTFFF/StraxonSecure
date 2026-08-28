// supabase/config.toml is project-managed; this function should run without JWT
// because it's invoked by the database trigger via pg_net (no Authorization header).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const SCHEMAS: Record<string, { name: string; description: string; parameters: unknown }> = {
  resume: {
    name: "build_resume",
    description: "Generate a polished, ATS-friendly resume.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["resume"] },
        name: { type: "string" },
        title: { type: "string" },
        contact: {
          type: "object",
          properties: {
            email: { type: "string" }, phone: { type: "string" },
            location: { type: "string" }, linkedin: { type: "string" },
          },
        },
        summary: { type: "string" },
        skills: { type: "array", items: { type: "string" }, minItems: 6, maxItems: 14 },
        experience: {
          type: "array", minItems: 2, maxItems: 6,
          items: {
            type: "object",
            properties: {
              company: { type: "string" }, role: { type: "string" },
              start: { type: "string" }, end: { type: "string" },
              highlights: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            },
            required: ["company", "role", "start", "end", "highlights"],
          },
        },
        education: {
          type: "array", maxItems: 3,
          items: {
            type: "object",
            properties: { school: { type: "string" }, degree: { type: "string" }, year: { type: "string" } },
            required: ["school", "degree", "year"],
          },
        },
      },
      required: ["kind", "name", "title", "summary", "skills", "experience", "education", "contact"],
    },
  },
  branding: {
    name: "build_brand_kit",
    description: "Generate a complete brand identity kit.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["branding"] },
        brand_name: { type: "string" },
        tagline: { type: "string" },
        mission: { type: "string" },
        voice: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
        palette: {
          type: "array", minItems: 4, maxItems: 6,
          items: {
            type: "object",
            properties: { name: { type: "string" }, hex: { type: "string" }, usage: { type: "string" } },
            required: ["name", "hex", "usage"],
          },
        },
        typography: {
          type: "object",
          properties: { heading: { type: "string" }, body: { type: "string" }, rationale: { type: "string" } },
          required: ["heading", "body", "rationale"],
        },
        logo_concept: { type: "string" },
        do_dont: {
          type: "object",
          properties: {
            dos: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
            donts: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
          },
          required: ["dos", "donts"],
        },
      },
      required: ["kind", "brand_name", "tagline", "mission", "voice", "palette", "typography", "logo_concept", "do_dont"],
    },
  },
  website: {
    name: "build_website_blueprint",
    description: "Generate a website blueprint and content plan.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["website"] },
        site_name: { type: "string" }, tagline: { type: "string" },
        pages: {
          type: "array", minItems: 5, maxItems: 9,
          items: {
            type: "object",
            properties: {
              slug: { type: "string" }, purpose: { type: "string" },
              sections: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
            },
            required: ["slug", "purpose", "sections"],
          },
        },
        hero: {
          type: "object",
          properties: { headline: { type: "string" }, subheadline: { type: "string" }, cta: { type: "string" } },
          required: ["headline", "subheadline", "cta"],
        },
        seo: {
          type: "object",
          properties: {
            title: { type: "string" }, description: { type: "string" },
            keywords: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 12 },
          },
          required: ["title", "description", "keywords"],
        },
      },
      required: ["kind", "site_name", "tagline", "pages", "hero", "seo"],
    },
  },
  seo: {
    name: "build_seo_plan",
    description: "Generate an SEO growth plan.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["seo"] },
        audit_summary: { type: "string" },
        target_keywords: {
          type: "array", minItems: 6, maxItems: 12,
          items: {
            type: "object",
            properties: {
              keyword: { type: "string" }, volume: { type: "string" },
              difficulty: { type: "string" }, intent: { type: "string" },
            },
            required: ["keyword", "volume", "difficulty", "intent"],
          },
        },
        content_plan: {
          type: "array", minItems: 6, maxItems: 12,
          items: {
            type: "object",
            properties: { title: { type: "string" }, angle: { type: "string" }, cluster: { type: "string" } },
            required: ["title", "angle", "cluster"],
          },
        },
        technical_recommendations: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
      },
      required: ["kind", "audit_summary", "target_keywords", "content_plan", "technical_recommendations"],
    },
  },
  template: {
    name: "build_template_pack",
    description: "Generate a template product description.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["template"] },
        product_name: { type: "string" },
        download_instructions: { type: "string" },
        features: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
      },
      required: ["kind", "product_name", "download_instructions", "features"],
    },
  },
  social: {
    name: "build_social_kit",
    description: "Generate a 30-day social media content calendar.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["social"] },
        brand_name: { type: "string" },
        pillars: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
        posts: {
          type: "array", minItems: 10, maxItems: 30,
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              pillar: { type: "string" },
              hook: { type: "string" },
              caption: { type: "string" },
              hashtags: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 12 },
              cta: { type: "string" },
            },
            required: ["day", "pillar", "hook", "caption", "hashtags", "cta"],
          },
        },
      },
      required: ["kind", "brand_name", "pillars", "posts"],
    },
  },
  adcopy: {
    name: "build_ad_pack",
    description: "Generate a pack of high-converting ad variants.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["adcopy"] },
        product_name: { type: "string" },
        ads: {
          type: "array", minItems: 6, maxItems: 12,
          items: {
            type: "object",
            properties: {
              angle: { type: "string" },
              headline: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
            },
            required: ["angle", "headline", "body", "cta"],
          },
        },
      },
      required: ["kind", "product_name", "ads"],
    },
  },
  email: {
    name: "build_email_sequence",
    description: "Generate a 7-email nurture sequence.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["email"] },
        business_name: { type: "string" },
        emails: {
          type: "array", minItems: 5, maxItems: 9,
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              day: { type: "string" },
              subject: { type: "string" },
              preview: { type: "string" },
              body: { type: "string" },
            },
            required: ["step", "day", "subject", "preview", "body"],
          },
        },
      },
      required: ["kind", "business_name", "emails"],
    },
  },
  chatbot: {
    name: "build_chatbot_script",
    description: "Generate a structured chatbot intent / response tree.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["chatbot"] },
        business_name: { type: "string" },
        intents: {
          type: "array", minItems: 8, maxItems: 20,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              examples: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              response: { type: "string" },
              followups: { type: "array", items: { type: "string" } },
            },
            required: ["name", "examples", "response"],
          },
        },
        fallback: { type: "string" },
      },
      required: ["kind", "business_name", "intents", "fallback"],
    },
  },
  pitchdeck: {
    name: "build_pitch_deck",
    description: "Generate a 12-slide investor pitch deck blueprint.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["pitchdeck"] },
        company_name: { type: "string" },
        stage: { type: "string" },
        raise_amount: { type: "string" },
        slides: {
          type: "array", minItems: 10, maxItems: 14,
          items: {
            type: "object",
            properties: {
              number: { type: "number" },
              title: { type: "string" },
              headline: { type: "string" },
              bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
              speaker_notes: { type: "string" },
            },
            required: ["number", "title", "headline", "bullets", "speaker_notes"],
          },
        },
      },
      required: ["kind", "company_name", "stage", "raise_amount", "slides"],
    },
  },
  bizplan: {
    name: "build_business_plan",
    description: "Generate a complete business plan document.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["bizplan"] },
        business_name: { type: "string" },
        executive_summary: { type: "string" },
        market_analysis: { type: "string" },
        competitive_landscape: { type: "string" },
        business_model: { type: "string" },
        go_to_market: { type: "string" },
        operations_plan: { type: "string" },
        financial_outline: {
          type: "array", minItems: 3, maxItems: 5,
          items: {
            type: "object",
            properties: {
              year: { type: "string" }, revenue: { type: "string" },
              costs: { type: "string" }, notes: { type: "string" },
            },
            required: ["year", "revenue", "costs", "notes"],
          },
        },
        milestones: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
      },
      required: ["kind", "business_name", "executive_summary", "market_analysis", "competitive_landscape", "business_model", "go_to_market", "operations_plan", "financial_outline", "milestones"],
    },
  },
  naming: {
    name: "build_naming_pack",
    description: "Generate 10 brandable product names with rationale.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["naming"] },
        category: { type: "string" },
        names: {
          type: "array", minItems: 8, maxItems: 12,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              rationale: { type: "string" },
              domain_hint: { type: "string" },
              trademark_risk: { type: "string" },
            },
            required: ["name", "rationale", "domain_hint", "trademark_risk"],
          },
        },
      },
      required: ["kind", "category", "names"],
    },
  },
  linkedin: {
    name: "build_linkedin_profile",
    description: "Generate an optimized LinkedIn profile rewrite.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["linkedin"] },
        full_name: { type: "string" },
        headline_options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        about: { type: "string" },
        experience_bullets: {
          type: "array", minItems: 1, maxItems: 6,
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            },
            required: ["role", "bullets"],
          },
        },
        skills: { type: "array", items: { type: "string" }, minItems: 8, maxItems: 20 },
      },
      required: ["kind", "full_name", "headline_options", "about", "experience_bullets", "skills"],
    },
  },
  pressrelease: {
    name: "build_press_release",
    description: "Generate an AP-style press release plus media pitch email.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["pressrelease"] },
        company_name: { type: "string" },
        release: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subhead: { type: "string" },
            dateline: { type: "string" },
            body: { type: "string" },
            quote: { type: "string" },
            boilerplate: { type: "string" },
          },
          required: ["headline", "subhead", "dateline", "body", "quote", "boilerplate"],
        },
        media_pitch: {
          type: "object",
          properties: { subject: { type: "string" }, body: { type: "string" } },
          required: ["subject", "body"],
        },
        suggested_outlets: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
      },
      required: ["kind", "company_name", "release", "media_pitch", "suggested_outlets"],
    },
  },
};

const SYSTEM_PROMPTS: Record<string, string> = {
  resume:
    "You are an elite executive resume writer. Output a recruiter-grade, ATS-friendly resume tailored to the target role and industry. Use crisp, quantified bullet highlights. Never fabricate roles the user did not mention; infer realistic detail when sparse.",
  branding:
    "You are a senior brand strategist. Produce a coherent brand identity kit with a tight palette (clean hex codes), distinctive typography pairing, and clear voice guidelines.",
  website:
    "You are a conversion-focused web strategist. Output a high-converting site blueprint with crystal-clear page purposes and SEO-ready metadata.",
  seo: "You are a senior SEO strategist. Produce a realistic, opportunity-focused growth plan with concrete keywords, intents, and a content cluster strategy.",
  template:
    "You are a digital products copywriter. Write a concise template product description and feature list.",
  social:
    "You are a social media strategist. Produce a 30-day calendar with scroll-stopping hooks, on-brand captions, and a tight hashtag strategy.",
  adcopy:
    "You are a direct-response copywriter. Produce ad variants with distinct angles, sharp headlines, urgency, and clear CTAs.",
  email:
    "You are a top-tier email copywriter. Produce a nurture sequence that warms cold subscribers and converts them to paying customers.",
  chatbot:
    "You are a conversation designer. Produce a structured chatbot script with crisp intents, natural responses, and graceful fallbacks.",
  pitchdeck:
    "You are a venture-grade pitch deck strategist. Produce a tight 12-slide narrative covering problem, solution, market, traction, business model, GTM, team, and ask. Each slide must have a sharp headline, scannable bullets, and natural speaker notes.",
  bizplan:
    "You are a senior management consultant writing a bank/investor-grade business plan. Be specific, realistic, and concrete. Avoid fluff.",
  naming:
    "You are a brand naming specialist. Produce distinctive, memorable, brandable names — avoid generic dictionary words. Note domain availability hints and trademark risk pragmatically.",
  linkedin:
    "You are an executive personal branding strategist. Produce a recruiter-magnet LinkedIn rewrite with quantified bullets and a hooky About section.",
  pressrelease:
    "You are a senior PR strategist writing AP-style press releases. Lead with the news, write a strong dateline and quote, end with boilerplate, then craft a tight media pitch email.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id required");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: order, error: oErr } = await admin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (oErr || !order) throw new Error(oErr?.message || "Order not found");

    const kind = order.service_type as keyof typeof SCHEMAS;
    const schema = SCHEMAS[kind];
    const system = SYSTEM_PROMPTS[kind] || "You are a senior consultant.";
    if (!schema) throw new Error(`No generator for service_type=${kind}`);

    // Brand Brain injection (server-side, secure). Falls back gracefully if not configured.
    let brandBlock = "";
    if (order.workspace_id) {
      const { data: bb } = await admin.from("brand_brain").select("*").eq("workspace_id", order.workspace_id).maybeSingle();
      if (bb && bb.is_configured) {
        brandBlock = `\n\nBRAND BRAIN (must obey strictly):\n${JSON.stringify({
          brand_name: bb.brand_name, mission: bb.mission, audience: bb.audience,
          tone: { professional: bb.tone_professional, playful: bb.tone_playful, bold: bb.tone_bold, warm: bb.tone_warm },
          palette: bb.palette, dos: bb.dos, donts: bb.donts,
        }, null, 2)}`;
      } else {
        brandBlock = `\n\n(No Brand Brain configured for this workspace — use sensible defaults but do not fabricate brand specifics.)`;
      }
    }

    const userPrompt = `Service: ${order.service_name}
Order intake JSON:
${JSON.stringify(order.intake_data, null, 2)}${brandBlock}

Produce the deliverable now using the provided tool.`;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: schema }],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("OpenAI error", aiResp.status, text);
      const human =
        aiResp.status === 429 ? "Rate limit hit. Try again shortly."
        : aiResp.status === 401 ? "OpenAI API key is missing or invalid."
        : `AI gateway error (${aiResp.status})`;
      await admin.from("orders").update({ status: "pending", error_message: human }).eq("id", order_id);
      return new Response(JSON.stringify({ error: human }), {
        status: aiResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Model did not return tool arguments");
    }
    const generated = JSON.parse(toolCall.function.arguments);

    const { error: uErr } = await admin
      .from("orders")
      .update({
        generated_content: generated,
        status: "completed",
        progress: 100,
        error_message: null,
      })
      .eq("id", order_id);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true, order_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("generate-deliverable failed:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
