// Proposals.tsx — conditional A4 deliverable renderer with runtime schema validation.

import { A4Document } from "@/components/A4Document";
import { Button } from "@/components/ui/button";
import { Download, Printer, AlertTriangle } from "lucide-react";
import {
  DeliverableContent,
  IBrandKitData,
  IResumeData,
  IWebsiteData,
  ISeoData,
  ITemplateData,
  ISocialData,
  IAdCopyData,
  IEmailData,
  IChatbotData,
  IPitchDeckData,
  IBizPlanData,
  INamingData,
  ILinkedInData,
  IPressReleaseData,
  parseDeliverable,
} from "@/types/deliverables";

interface OrderLike {
  id: string;
  service_type: string;
  service_name: string;
  intake_data: Record<string, unknown>;
  generated_content?: DeliverableContent | null | unknown;
}

export const ProposalPreview = ({ order }: { order: OrderLike }) => {
  // Validate at the boundary — never trust DB JSONB blindly.
  const content = parseDeliverable(order.generated_content);
  const hasRaw = !!order.generated_content;

  return (
    <div>
      <div className="no-print flex justify-between items-center mb-4 px-1">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{order.service_name}</p>
          <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={() => window.print()} className="bg-gradient-primary text-primary-foreground border-0">
            <Download className="h-4 w-4 mr-2" /> Save PDF
          </Button>
        </div>
      </div>

      <A4Document>
        {!content ? (
          hasRaw ? (
            <SchemaErrorLayout order={order} />
          ) : (
            <PlaceholderLayout order={order} />
          )
        ) : content.kind === "resume" ? (
          <ResumeLayout data={content} />
        ) : content.kind === "branding" ? (
          <BrandingLayout data={content} />
        ) : content.kind === "website" ? (
          <WebsiteLayout data={content} />
        ) : content.kind === "seo" ? (
          <SeoLayout data={content} />
        ) : content.kind === "template" ? (
          <TemplateLayout data={content} />
        ) : content.kind === "social" ? (
          <SocialLayout data={content} />
        ) : content.kind === "adcopy" ? (
          <AdCopyLayout data={content} />
        ) : content.kind === "email" ? (
          <EmailLayout data={content} />
        ) : content.kind === "chatbot" ? (
          <ChatbotLayout data={content} />
        ) : content.kind === "pitchdeck" ? (
          <PitchDeckLayout data={content} />
        ) : content.kind === "bizplan" ? (
          <BizPlanLayout data={content} />
        ) : content.kind === "naming" ? (
          <NamingLayout data={content} />
        ) : content.kind === "linkedin" ? (
          <LinkedInLayout data={content} />
        ) : content.kind === "pressrelease" ? (
          <PressReleaseLayout data={content} />
        ) : (
          <PlaceholderLayout order={order} />
        )}
      </A4Document>
    </div>
  );
};

// ----- Layouts ---------------------------------------------------------------

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{
    fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.18em",
    color: "#1a1a1a", margin: "0 0 2mm", paddingBottom: "1mm",
    borderBottom: "1px solid #1a1a1a",
  }}>{children}</h3>
);

const ResumeLayout = ({ data }: { data: IResumeData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{data.name}</h1>
      <p style={{ fontSize: "12pt", color: "#444", margin: "1mm 0 2mm" }}>{data.title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4mm", fontSize: "9pt", color: "#555" }}>
        {data.contact.email && <span>{data.contact.email}</span>}
        {data.contact.phone && <span>· {data.contact.phone}</span>}
        {data.contact.location && <span>· {data.contact.location}</span>}
        {data.contact.linkedin && <span>· {data.contact.linkedin}</span>}
      </div>
    </header>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Summary</SectionHeading>
      <p style={{ margin: 0 }}>{data.summary}</p>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Core Skills</SectionHeading>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm" }}>
        {data.skills.map((s) => (
          <span key={s} style={{
            fontSize: "9pt", padding: "1mm 2.5mm", border: "1px solid #ddd", borderRadius: "2mm",
          }}>{s}</span>
        ))}
      </div>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Experience</SectionHeading>
      {data.experience.map((e, i) => (
        <div key={i} style={{ marginBottom: "3mm" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ fontSize: "11pt" }}>{e.role} · {e.company}</strong>
            <span style={{ fontSize: "9pt", color: "#666" }}>{e.start} – {e.end}</span>
          </div>
          <ul style={{ margin: "1mm 0 0 5mm", padding: 0 }}>
            {e.highlights.map((h, j) => <li key={j} style={{ marginBottom: "0.5mm" }}>{h}</li>)}
          </ul>
        </div>
      ))}
    </section>

    <section>
      <SectionHeading>Education</SectionHeading>
      {data.education.map((ed, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
          <span><strong>{ed.degree}</strong> · {ed.school}</span>
          <span style={{ color: "#666", fontSize: "9pt" }}>{ed.year}</span>
        </div>
      ))}
    </section>
  </div>
);

const BrandingLayout = ({ data }: { data: IBrandKitData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Brand Kit</p>
      <h1 style={{ fontSize: "26pt", fontWeight: 700, margin: "1mm 0", letterSpacing: "-0.02em" }}>{data.brand_name}</h1>
      <p style={{ fontSize: "12pt", color: "#444", fontStyle: "italic", margin: 0 }}>{data.tagline}</p>
    </header>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Mission</SectionHeading>
      <p style={{ margin: 0 }}>{data.mission}</p>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Color Palette</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(data.palette.length, 6)}, 1fr)`, gap: "3mm" }}>
        {data.palette.map((c) => (
          <div key={c.hex}>
            <div style={{ width: "100%", height: "22mm", background: c.hex, borderRadius: "2mm", border: "1px solid #eee" }} />
            <p style={{ margin: "1mm 0 0", fontSize: "9pt", fontWeight: 600 }}>{c.name}</p>
            <p style={{ margin: 0, fontSize: "8pt", color: "#666", fontFamily: "monospace" }}>{c.hex}</p>
            <p style={{ margin: "0.5mm 0 0", fontSize: "8pt", color: "#666" }}>{c.usage}</p>
          </div>
        ))}
      </div>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Typography</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
        <div>
          <p style={{ fontSize: "8pt", color: "#666", margin: 0 }}>HEADING</p>
          <p style={{ fontSize: "18pt", fontWeight: 700, margin: "1mm 0", fontFamily: data.typography.heading }}>
            {data.typography.heading}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "8pt", color: "#666", margin: 0 }}>BODY</p>
          <p style={{ fontSize: "12pt", margin: "1mm 0", fontFamily: data.typography.body }}>
            {data.typography.body}
          </p>
        </div>
      </div>
      <p style={{ fontSize: "9pt", color: "#555", marginTop: "2mm" }}>{data.typography.rationale}</p>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Voice</SectionHeading>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm" }}>
        {data.voice.map((v) => (
          <span key={v} style={{
            fontSize: "9pt", padding: "1mm 2.5mm", background: "#0a0a0a", color: "white", borderRadius: "2mm",
          }}>{v}</span>
        ))}
      </div>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Logo Concept</SectionHeading>
      <p style={{ margin: 0 }}>{data.logo_concept}</p>
    </section>

    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
      <div>
        <SectionHeading>Do</SectionHeading>
        <ul style={{ margin: "0 0 0 5mm", padding: 0 }}>
          {data.do_dont.dos.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
      <div>
        <SectionHeading>Don't</SectionHeading>
        <ul style={{ margin: "0 0 0 5mm", padding: 0 }}>
          {data.do_dont.donts.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
    </section>
  </div>
);

const WebsiteLayout = ({ data }: { data: IWebsiteData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Website Blueprint</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.site_name}</h1>
      <p style={{ fontStyle: "italic", color: "#444", margin: 0 }}>{data.tagline}</p>
    </header>

    <section style={{ marginBottom: "5mm", padding: "4mm", background: "#0a0a0a", color: "white", borderRadius: "2mm" }}>
      <p style={{ fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.2em", color: "#888", margin: 0 }}>Hero</p>
      <h2 style={{ fontSize: "16pt", margin: "1mm 0", fontWeight: 700 }}>{data.hero.headline}</h2>
      <p style={{ margin: "0 0 2mm" }}>{data.hero.subheadline}</p>
      <span style={{ fontSize: "9pt", padding: "1mm 3mm", background: "white", color: "black", borderRadius: "2mm", display: "inline-block" }}>
        {data.hero.cta}
      </span>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Pages</SectionHeading>
      {data.pages.map((p) => (
        <div key={p.slug} style={{ marginBottom: "2mm", paddingBottom: "2mm", borderBottom: "1px dashed #ddd" }}>
          <strong>/{p.slug}</strong> — <span style={{ color: "#444" }}>{p.purpose}</span>
          <div style={{ fontSize: "9pt", color: "#666", marginTop: "0.5mm" }}>
            Sections: {p.sections.join(" · ")}
          </div>
        </div>
      ))}
    </section>

    <section>
      <SectionHeading>SEO</SectionHeading>
      <p style={{ margin: 0 }}><strong>Title:</strong> {data.seo.title}</p>
      <p style={{ margin: "1mm 0" }}><strong>Description:</strong> {data.seo.description}</p>
      <p style={{ margin: 0 }}><strong>Keywords:</strong> {data.seo.keywords.join(", ")}</p>
    </section>
  </div>
);

const SeoLayout = ({ data }: { data: ISeoData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>SEO Growth Plan</p>
      <h1 style={{ fontSize: "20pt", fontWeight: 700, margin: "1mm 0" }}>Audit & Roadmap</h1>
    </header>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Audit Summary</SectionHeading>
      <p style={{ margin: 0 }}>{data.audit_summary}</p>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Target Keywords</SectionHeading>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Keyword</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Volume</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Difficulty</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Intent</th>
          </tr>
        </thead>
        <tbody>
          {data.target_keywords.map((k, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "1mm 2mm", fontWeight: 600 }}>{k.keyword}</td>
              <td style={{ padding: "1mm 2mm" }}>{k.volume}</td>
              <td style={{ padding: "1mm 2mm" }}>{k.difficulty}</td>
              <td style={{ padding: "1mm 2mm" }}>{k.intent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Content Plan</SectionHeading>
      {data.content_plan.map((c, i) => (
        <div key={i} style={{ marginBottom: "1.5mm" }}>
          <strong>{c.title}</strong> <span style={{ fontSize: "8pt", color: "#666", padding: "0 1.5mm", border: "1px solid #ccc", borderRadius: "1mm" }}>{c.cluster}</span>
          <div style={{ fontSize: "9pt", color: "#555" }}>{c.angle}</div>
        </div>
      ))}
    </section>

    <section>
      <SectionHeading>Technical Recommendations</SectionHeading>
      <ul style={{ margin: "0 0 0 5mm", padding: 0 }}>
        {data.technical_recommendations.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </section>
  </div>
);

const TemplateLayout = ({ data }: { data: ITemplateData }) => (
  <div>
    <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: 0 }}>{data.product_name}</h1>
    <SectionHeading>Features</SectionHeading>
    <ul style={{ margin: "0 0 4mm 5mm" }}>
      {data.features.map((f, i) => <li key={i}>{f}</li>)}
    </ul>
    <SectionHeading>Download Instructions</SectionHeading>
    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.download_instructions}</p>
  </div>
);

const SocialLayout = ({ data }: { data: ISocialData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Social Content Kit</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.brand_name}</h1>
    </header>
    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>Content Pillars</SectionHeading>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm" }}>
        {data.pillars.map((p) => (
          <span key={p} style={{ fontSize: "9pt", padding: "1mm 2.5mm", border: "1px solid #ccc", borderRadius: "2mm" }}>{p}</span>
        ))}
      </div>
    </section>
    <section>
      <SectionHeading>Posts</SectionHeading>
      {data.posts.map((p, i) => (
        <div key={i} style={{ marginBottom: "3mm", paddingBottom: "2mm", borderBottom: "1px dashed #ddd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#666" }}>
            <strong>Day {p.day} · {p.pillar}</strong>
            <em>{p.cta}</em>
          </div>
          <p style={{ margin: "1mm 0 0.5mm", fontWeight: 600 }}>{p.hook}</p>
          <p style={{ margin: 0, fontSize: "10pt" }}>{p.caption}</p>
          <p style={{ margin: "1mm 0 0", fontSize: "8.5pt", color: "#0066cc" }}>{p.hashtags.join(" ")}</p>
        </div>
      ))}
    </section>
  </div>
);

const AdCopyLayout = ({ data }: { data: IAdCopyData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Ad Copy Pack</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.product_name}</h1>
    </header>
    {data.ads.map((a, i) => (
      <section key={i} style={{ marginBottom: "4mm", padding: "3mm", border: "1px solid #ddd", borderRadius: "2mm" }}>
        <p style={{ fontSize: "8pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Ad {i + 1} · {a.angle}
        </p>
        <h2 style={{ fontSize: "14pt", margin: "1mm 0" }}>{a.headline}</h2>
        <p style={{ margin: "1mm 0", fontSize: "10pt" }}>{a.body}</p>
        <span style={{ fontSize: "9pt", padding: "1mm 3mm", background: "#0a0a0a", color: "white", borderRadius: "1mm", display: "inline-block" }}>{a.cta}</span>
      </section>
    ))}
  </div>
);

const EmailLayout = ({ data }: { data: IEmailData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Email Sequence</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.business_name}</h1>
    </header>
    {data.emails.map((e) => (
      <section key={e.step} style={{ marginBottom: "5mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#666" }}>
          <strong>Email {e.step} · {e.day}</strong>
        </div>
        <p style={{ margin: "1mm 0 0", fontWeight: 700, fontSize: "12pt" }}>{e.subject}</p>
        <p style={{ margin: "0.5mm 0", fontSize: "9pt", color: "#666", fontStyle: "italic" }}>{e.preview}</p>
        <p style={{ margin: "1mm 0 0", whiteSpace: "pre-wrap", fontSize: "10pt" }}>{e.body}</p>
      </section>
    ))}
  </div>
);

const ChatbotLayout = ({ data }: { data: IChatbotData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Chatbot Script</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.business_name}</h1>
    </header>
    <SectionHeading>Intents</SectionHeading>
    {data.intents.map((it, i) => (
      <section key={i} style={{ marginBottom: "3mm", paddingBottom: "2mm", borderBottom: "1px dashed #ddd" }}>
        <strong style={{ fontSize: "11pt" }}>{it.name}</strong>
        <p style={{ margin: "1mm 0 0", fontSize: "9pt", color: "#666" }}>
          Examples: {it.examples.map((e) => `"${e}"`).join(", ")}
        </p>
        <p style={{ margin: "1mm 0 0" }}>↳ {it.response}</p>
        {it.followups && it.followups.length > 0 && (
          <p style={{ margin: "1mm 0 0", fontSize: "9pt", color: "#444" }}>
            Follow-ups: {it.followups.join(" · ")}
          </p>
        )}
      </section>
    ))}
    <section style={{ marginTop: "4mm" }}>
      <SectionHeading>Fallback</SectionHeading>
      <p style={{ margin: 0 }}>{data.fallback}</p>
    </section>
  </div>
);

const PitchDeckLayout = ({ data }: { data: IPitchDeckData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Investor Pitch Deck</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.company_name}</h1>
      <p style={{ fontSize: "10pt", color: "#444", margin: 0 }}>{data.stage} · Raising {data.raise_amount}</p>
    </header>
    {data.slides.map((s) => (
      <section key={s.number} style={{ marginBottom: "4mm", padding: "3mm", border: "1px solid #ddd", borderRadius: "2mm" }}>
        <p style={{ fontSize: "8pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Slide {s.number} · {s.title}
        </p>
        <h2 style={{ fontSize: "14pt", margin: "1mm 0", fontWeight: 700 }}>{s.headline}</h2>
        <ul style={{ margin: "1mm 0 1mm 5mm", padding: 0 }}>
          {s.bullets.map((b, i) => <li key={i} style={{ fontSize: "10pt" }}>{b}</li>)}
        </ul>
        <p style={{ margin: "1mm 0 0", fontSize: "9pt", color: "#555", fontStyle: "italic" }}>
          Speaker notes: {s.speaker_notes}
        </p>
      </section>
    ))}
  </div>
);

const BizPlanLayout = ({ data }: { data: IBizPlanData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Business Plan</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.business_name}</h1>
    </header>
    {[
      ["Executive Summary", data.executive_summary],
      ["Market Analysis", data.market_analysis],
      ["Competitive Landscape", data.competitive_landscape],
      ["Business Model", data.business_model],
      ["Go-To-Market", data.go_to_market],
      ["Operations Plan", data.operations_plan],
    ].map(([title, body]) => (
      <section key={title} style={{ marginBottom: "4mm" }}>
        <SectionHeading>{title}</SectionHeading>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{body}</p>
      </section>
    ))}
    <section style={{ marginBottom: "4mm" }}>
      <SectionHeading>Financial Outline</SectionHeading>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Year</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Revenue</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Costs</th>
            <th style={{ textAlign: "left", padding: "1mm 2mm" }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.financial_outline.map((f, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "1mm 2mm", fontWeight: 600 }}>{f.year}</td>
              <td style={{ padding: "1mm 2mm" }}>{f.revenue}</td>
              <td style={{ padding: "1mm 2mm" }}>{f.costs}</td>
              <td style={{ padding: "1mm 2mm" }}>{f.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
    <section>
      <SectionHeading>Milestones</SectionHeading>
      <ul style={{ margin: "0 0 0 5mm", padding: 0 }}>
        {data.milestones.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </section>
  </div>
);

const NamingLayout = ({ data }: { data: INamingData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Naming Pack</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.category}</h1>
    </header>
    {data.names.map((n, i) => (
      <section key={i} style={{ marginBottom: "3mm", paddingBottom: "2mm", borderBottom: "1px dashed #ddd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: "14pt" }}>{n.name}</strong>
          <span style={{ fontSize: "8pt", color: "#666", fontFamily: "monospace" }}>{n.domain_hint}</span>
        </div>
        <p style={{ margin: "1mm 0 0", fontSize: "10pt" }}>{n.rationale}</p>
        <p style={{ margin: "0.5mm 0 0", fontSize: "8.5pt", color: "#b91c1c" }}>TM risk: {n.trademark_risk}</p>
      </section>
    ))}
  </div>
);

const LinkedInLayout = ({ data }: { data: ILinkedInData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>LinkedIn Optimization</p>
      <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: "1mm 0" }}>{data.full_name}</h1>
    </header>
    <section style={{ marginBottom: "4mm" }}>
      <SectionHeading>Headline Options</SectionHeading>
      <ol style={{ margin: "0 0 0 5mm", padding: 0 }}>
        {data.headline_options.map((h, i) => <li key={i} style={{ marginBottom: "1mm" }}>{h}</li>)}
      </ol>
    </section>
    <section style={{ marginBottom: "4mm" }}>
      <SectionHeading>About</SectionHeading>
      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.about}</p>
    </section>
    <section style={{ marginBottom: "4mm" }}>
      <SectionHeading>Experience Bullets</SectionHeading>
      {data.experience_bullets.map((e, i) => (
        <div key={i} style={{ marginBottom: "2mm" }}>
          <strong>{e.role}</strong>
          <ul style={{ margin: "1mm 0 0 5mm", padding: 0 }}>
            {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
          </ul>
        </div>
      ))}
    </section>
    <section>
      <SectionHeading>Skills</SectionHeading>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2mm" }}>
        {data.skills.map((s) => (
          <span key={s} style={{ fontSize: "9pt", padding: "1mm 2.5mm", border: "1px solid #ddd", borderRadius: "2mm" }}>{s}</span>
        ))}
      </div>
    </section>
  </div>
);

const PressReleaseLayout = ({ data }: { data: IPressReleaseData }) => (
  <div>
    <header style={{ marginBottom: "5mm" }}>
      <p style={{ fontSize: "9pt", color: "#666", margin: 0, textTransform: "uppercase", letterSpacing: "0.2em" }}>Press Release · For Immediate Release</p>
      <h1 style={{ fontSize: "20pt", fontWeight: 700, margin: "2mm 0", lineHeight: 1.2 }}>{data.release.headline}</h1>
      <p style={{ fontSize: "12pt", color: "#444", margin: 0, fontStyle: "italic" }}>{data.release.subhead}</p>
    </header>
    <section style={{ marginBottom: "4mm" }}>
      <p style={{ margin: 0, fontSize: "10pt" }}><strong>{data.release.dateline}</strong> — {data.release.body}</p>
    </section>
    <section style={{ marginBottom: "4mm", padding: "3mm", borderLeft: "3px solid #0a0a0a", background: "#f7f7f7" }}>
      <p style={{ margin: 0, fontStyle: "italic" }}>{data.release.quote}</p>
    </section>
    <section style={{ marginBottom: "5mm" }}>
      <SectionHeading>About {data.company_name}</SectionHeading>
      <p style={{ margin: 0, fontSize: "9pt" }}>{data.release.boilerplate}</p>
    </section>
    <section style={{ marginBottom: "4mm" }}>
      <SectionHeading>Media Pitch Email</SectionHeading>
      <p style={{ margin: 0, fontSize: "10pt" }}><strong>Subject:</strong> {data.media_pitch.subject}</p>
      <p style={{ margin: "1mm 0 0", whiteSpace: "pre-wrap", fontSize: "10pt" }}>{data.media_pitch.body}</p>
    </section>
    <section>
      <SectionHeading>Suggested Outlets</SectionHeading>
      <ul style={{ margin: "0 0 0 5mm", padding: 0 }}>
        {data.suggested_outlets.map((o, i) => <li key={i}>{o}</li>)}
      </ul>
    </section>
  </div>
);

const PlaceholderLayout = ({ order }: { order: OrderLike }) => (
  <div>
    <p style={{ fontSize: "9pt", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>{order.service_name}</p>
    <h1 style={{ fontSize: "20pt", margin: "2mm 0" }}>Awaiting generation</h1>
    <p style={{ color: "#444" }}>This deliverable hasn't been generated yet. Once your order moves to "processing", the automation engine will populate this document.</p>
    <pre style={{ marginTop: "5mm", padding: "3mm", background: "#f7f7f7", borderRadius: "2mm", fontSize: "8.5pt", whiteSpace: "pre-wrap" }}>
      {JSON.stringify(order.intake_data, null, 2)}
    </pre>
  </div>
);

const SchemaErrorLayout = ({ order }: { order: OrderLike }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: "3mm", color: "#b91c1c" }}>
      <AlertTriangle />
      <h1 style={{ fontSize: "18pt", margin: 0 }}>Generated content failed validation</h1>
    </div>
    <p style={{ marginTop: "3mm", color: "#444" }}>
      The automation engine returned data that did not match the expected schema for{" "}
      <strong>{order.service_name}</strong>. The deliverable cannot be rendered safely.
      An administrator can re-run generation from the admin panel.
    </p>
    <pre style={{ marginTop: "5mm", padding: "3mm", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "2mm", fontSize: "8pt", whiteSpace: "pre-wrap" }}>
      {JSON.stringify(order.generated_content, null, 2).slice(0, 1500)}
    </pre>
  </div>
);
