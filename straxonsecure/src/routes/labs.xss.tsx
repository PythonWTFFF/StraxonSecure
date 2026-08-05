import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame } from "@/components/labs/LabFrame";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/labs/xss")({
  head: () => ({
    meta: [
      { title: "XSS Lab — Straxon Secure" },
      { name: "description", content: "Stored & DOM-based Cross-Site Scripting hands-on lab." },
    ],
  }),
  component: XSSLab,
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function XSSLab() {
  const [comment, setComment] = useState("<img src=x onerror=\"alert('XSS')\" />");
  const [submitted, setSubmitted] = useState<string[]>([
    "Great article!",
    "<script>alert('pwned')</script>",
  ]);

  const submit = () => {
    if (comment.trim()) {
      setSubmitted((s) => [comment, ...s]);
      setComment("");
    }
  };

  const PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1) />",
    "<svg onload=alert('dom')>",
    '<a href="javascript:alert(1)">click</a>',
  ];

  return (
    <LabFrame title="CROSS-SITE SCRIPTING" badge="LAB-02" recorderLab="xss">
      <p className="text-muted-foreground max-w-3xl">
        Submit comments and compare how the same payload renders on a vulnerable vs sanitized board.
      </p>

      <CyberCard variant="cyan">
        <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
          Submit a comment
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none resize-none"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PAYLOADS.map((p) => (
            <button
              key={p}
              onClick={() => setComment(p)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 hover:bg-accent/10 hover:text-accent border border-border max-w-full truncate"
            >
              {p.length > 30 ? p.slice(0, 30) + "…" : p}
            </button>
          ))}
        </div>
        <CyberButton onClick={submit} className="mt-3">
          Post comment
        </CyberButton>
      </CyberCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-destructive mb-3">
            <ShieldAlert className="h-4 w-4" /> Vulnerable board (innerHTML)
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {submitted.map((c, i) => (
              <div
                key={i}
                className="rounded p-3 bg-background/40 border border-destructive/20 text-sm"
                dangerouslySetInnerHTML={{ __html: c }}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 font-mono">
            ⚠ This board renders raw HTML. Inline event handlers and scripts can execute.
          </p>
        </CyberCard>

        <CyberCard variant="cyan">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-success mb-3">
            <ShieldCheck className="h-4 w-4" /> Sanitized board (escaped)
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {submitted.map((c, i) => (
              <div
                key={i}
                className="rounded p-3 bg-background/40 border border-success/20 text-sm font-mono"
                dangerouslySetInnerHTML={{ __html: escapeHtml(c) }}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 font-mono">
            ✓ HTML entities escaped before render. Browser treats input as text.
          </p>
        </CyberCard>
      </div>

      <CyberCard variant="magenta">
        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">// FIX</div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            Escape HTML entities on output (or use a templating engine that does so by default).
          </li>
          <li>
            Set a strict <span className="text-accent font-mono">Content-Security-Policy</span>{" "}
            header (e.g. <span className="font-mono">script-src 'self'</span>).
          </li>
          <li>Use libraries like DOMPurify when rich HTML must be allowed.</li>
          <li>
            Mark cookies <span className="font-mono">HttpOnly</span> and{" "}
            <span className="font-mono">SameSite=Strict</span>.
          </li>
        </ul>
      </CyberCard>
    </LabFrame>
  );
}
