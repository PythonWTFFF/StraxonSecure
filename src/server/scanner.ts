import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkFeatureUsage, logFeatureUsage } from "./usage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScanFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  recommendation: string;
  cve?: string;
  cvss?: number;
  owasp?: string;
  line?: number;
  file?: string;
  evidence?: string;
}

// ─── OWASP Top 10 Scanner Engine ────────────────────────────────────────────

const OWASP_CHECKS = [
  // A01 - Broken Access Control
  {
    id: "A01-001",
    category: "A01:2021 - Broken Access Control",
    owasp: "A01",
    severity: "critical" as const,
    title: "Insecure Direct Object Reference (IDOR)",
    patterns: [/\/api\/users\/\d+/, /\/admin\/(?!auth)/, /user_id=\d+/],
    description: "API endpoints expose internal object references without authorization checks.",
    recommendation:
      "Implement object-level authorization. Verify user has permission before returning resources.",
    cvss: 8.1,
  },
  {
    id: "A01-002",
    category: "A01:2021 - Broken Access Control",
    owasp: "A01",
    severity: "high" as const,
    title: "Missing Function Level Access Control",
    patterns: [/\/admin\//, /isAdmin\s*=\s*true/, /role\s*=\s*['"]admin['"]/],
    description: "Administrative functionality is not properly protected.",
    recommendation: "Implement server-side role checks. Never trust client-side role data.",
    cvss: 7.5,
  },
  // A02 - Cryptographic Failures
  {
    id: "A02-001",
    category: "A02:2021 - Cryptographic Failures",
    owasp: "A02",
    severity: "critical" as const,
    title: "Hardcoded Secret / API Key",
    patterns: [
      /password\s*=\s*['"]\w{4,}['"]/,
      /api_key\s*=\s*['"]/,
      /secret\s*=\s*['"]\w{8,}['"]/,
      /AWS_SECRET/,
      /private_key/i,
    ],
    description: "Hardcoded credentials or API keys detected in source code.",
    recommendation:
      "Use environment variables for all secrets. Rotate exposed credentials immediately.",
    cvss: 9.8,
  },
  {
    id: "A02-002",
    category: "A02:2021 - Cryptographic Failures",
    owasp: "A02",
    severity: "high" as const,
    title: "Weak Hashing Algorithm",
    patterns: [/md5\(/, /sha1\(/, /hashlib\.md5/, /hashlib\.sha1/, /createHash\(['"]md5['"]\)/],
    description: "MD5 or SHA1 used for password hashing — cryptographically broken.",
    recommendation: "Use bcrypt, scrypt, or Argon2 for password hashing with proper salt rounds.",
    cvss: 7.4,
  },
  // A03 - Injection
  {
    id: "A03-001",
    category: "A03:2021 - Injection",
    owasp: "A03",
    severity: "critical" as const,
    title: "SQL Injection Vulnerability",
    patterns: [/query\s*\+\s*req\./, /execute\(['"].*\$\{/, /WHERE.*\+.*req\./, /`SELECT.*\${/],
    description: "User input concatenated directly into SQL queries.",
    recommendation:
      "Use parameterized queries or prepared statements. Never concatenate user input into SQL.",
    cvss: 9.8,
    cve: "CWE-89",
  },
  {
    id: "A03-002",
    category: "A03:2021 - Injection",
    owasp: "A03",
    severity: "high" as const,
    title: "Command Injection Risk",
    patterns: [/exec\(.*req\./, /spawn\(.*user/, /child_process.*input/, /os\.system\(.*f['"]/],
    description: "User-controlled data passed to OS command execution.",
    recommendation:
      "Avoid shell execution. Use library APIs instead. Sanitize all inputs if shell is unavoidable.",
    cvss: 9.0,
    cve: "CWE-78",
  },
  {
    id: "A03-003",
    category: "A03:2021 - Injection",
    owasp: "A03",
    severity: "high" as const,
    title: "Cross-Site Scripting (XSS)",
    patterns: [
      /innerHTML\s*=.*req\./,
      /document\.write\(/,
      /dangerouslySetInnerHTML/,
      /\.html\(.*input/,
    ],
    description: "Unsanitized user input rendered as HTML.",
    recommendation:
      "Escape all user output. Use textContent instead of innerHTML. Implement CSP headers.",
    cvss: 7.2,
    cve: "CWE-79",
  },
  // A04 - Insecure Design
  {
    id: "A04-001",
    category: "A04:2021 - Insecure Design",
    owasp: "A04",
    severity: "medium" as const,
    title: "Missing Rate Limiting",
    patterns: [/\/api\/auth\/login/, /\/api\/password-reset/, /\/api\/otp/],
    description: "Authentication endpoints lack rate limiting, enabling brute force attacks.",
    recommendation:
      "Implement rate limiting on all authentication endpoints (max 5 attempts/15 min).",
    cvss: 5.3,
  },
  // A05 - Security Misconfiguration
  {
    id: "A05-001",
    category: "A05:2021 - Security Misconfiguration",
    owasp: "A05",
    severity: "medium" as const,
    title: "Debug Mode Enabled",
    patterns: [/DEBUG\s*=\s*True/, /NODE_ENV\s*=\s*['"]development['"]/, /debug:\s*true/],
    description: "Application running in debug mode exposes stack traces and internal information.",
    recommendation:
      "Disable debug mode in production. Use proper error handling that doesn't leak internals.",
    cvss: 5.3,
  },
  {
    id: "A05-002",
    category: "A05:2021 - Security Misconfiguration",
    owasp: "A05",
    severity: "high" as const,
    title: "Missing Security Headers",
    patterns: [/app\.use\(cors\(\)\)/, /Access-Control-Allow-Origin.*\*/, /helmet/],
    description: "Missing or misconfigured security headers (CSP, HSTS, X-Frame-Options).",
    recommendation:
      "Use helmet.js (Node) or set headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.",
    cvss: 6.5,
  },
  // A07 - Authentication Failures
  {
    id: "A07-001",
    category: "A07:2021 - Auth Failures",
    owasp: "A07",
    severity: "critical" as const,
    title: "JWT Algorithm Confusion",
    patterns: [
      /alg.*none/,
      /verify.*false/,
      /jwt\.decode\((?!.*verify)/,
      /ignoreExpiration:\s*true/,
    ],
    description: "JWT tokens validated insecurely — alg:none or signature verification disabled.",
    recommendation:
      "Always verify JWT signatures. Whitelist allowed algorithms. Never accept alg:none.",
    cvss: 9.1,
    cve: "CWE-347",
  },
  // A09 - Security Logging
  {
    id: "A09-001",
    category: "A09:2021 - Security Logging Failures",
    owasp: "A09",
    severity: "low" as const,
    title: "Missing Security Event Logging",
    patterns: [/catch\s*\(\w*\)\s*\{\s*\}/],
    description: "Empty catch blocks silently swallow errors and security events.",
    recommendation:
      "Log all security-relevant events: auth failures, access violations, exceptions.",
    cvss: 4.0,
  },
];

function analyzeCode(code: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = code.split("\n");

  for (const check of OWASP_CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of check.patterns) {
        if (pattern.test(lines[i])) {
          findings.push({
            id: `${check.id}-L${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
            severity: check.severity,
            category: check.category,
            title: check.title,
            description: check.description,
            recommendation: check.recommendation,
            cve: check.cve,
            cvss: check.cvss,
            owasp: check.owasp,
            line: i + 1,
            evidence: lines[i].trim().slice(0, 100),
          });
          break; // one finding per line per check
        }
      }
    }
  }

  return findings;
}

function checkSecrets(code: string): ScanFinding[] {
  const secretPatterns = [
    { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/, severity: "critical" as const },
    { name: "AWS Secret Key", pattern: /[0-9a-zA-Z/+]{40}/, severity: "critical" as const },
    { name: "GitHub Token", pattern: /ghp_[0-9a-zA-Z]{36}/, severity: "critical" as const },
    {
      name: "Stripe Secret Key",
      pattern: /sk_live_[0-9a-zA-Z]{24,}/,
      severity: "critical" as const,
    },
    {
      name: "Stripe Publishable Key",
      pattern: /pk_live_[0-9a-zA-Z]{24,}/,
      severity: "medium" as const,
    },
    { name: "Google API Key", pattern: /AIza[0-9A-Za-z\-_]{35}/, severity: "high" as const },
    {
      name: "JWT Secret",
      pattern: /jwt[_\s]secret\s*[:=]\s*['"]\w{8,}['"]/,
      severity: "critical" as const,
      flags: "i",
    },
    {
      name: "Database Password",
      pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/,
      severity: "high" as const,
      flags: "i",
    },
    {
      name: "Private Key Block",
      pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/,
      severity: "critical" as const,
    },
    { name: "Slack Webhook", pattern: /hooks\.slack\.com\/services\//, severity: "high" as const },
  ];

  const findings: ScanFinding[] = [];
  const lines = code.split("\n");

  for (const { name, pattern, severity } of secretPatterns) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        findings.push({
          id: `SECRET-${name.replace(/\s/g, "_")}-L${i + 1}`,
          severity,
          category: "Secrets Detection",
          title: `Exposed ${name}`,
          description: `${name} detected in source code. This credential may be compromised.`,
          recommendation:
            "Remove immediately from source. Rotate the credential. Use environment variables.",
          line: i + 1,
          evidence: lines[i]
            .trim()
            .replace(/[A-Z0-9]{20,}/g, "***REDACTED***")
            .slice(0, 100),
        });
      }
    }
  }

  return findings;
}

// ─── Run Full Scan ───────────────────────────────────────────────────────────

export const runFullScan = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        code: z.string().max(100_000),
        filename: z.string().max(200).default("unknown"),
        scanType: z.enum(["owasp", "secrets", "full"]).default("full"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // 1. Usage Enforcement
    await checkFeatureUsage((context as any).userId as string, "code_scan");
    await logFeatureUsage(
      (context as any).userId as string,
      "code_scan",
      { filename: data.filename, scanType: data.scanType },
      (context as any).requestId as string,
    );

    const findings: ScanFinding[] = [];

    if (data.scanType === "owasp" || data.scanType === "full") {
      findings.push(...analyzeCode(data.code));
    }
    if (data.scanType === "secrets" || data.scanType === "full") {
      findings.push(...checkSecrets(data.code));
    }

    // Deduplicate by line+title
    const seen = new Set<string>();
    const unique = findings.filter((f) => {
      const key = `${f.line}-${f.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Calculate risk score
    const scoreMap = { critical: 40, high: 20, medium: 10, low: 3, info: 1 };
    const riskScore = Math.min(
      unique.reduce((s, f) => s + (scoreMap[f.severity] ?? 0), 0),
      100,
    );

    // Save to Supabase
    const { data: saved } = await supabaseAdmin
      .from("scan_results")
      .insert({
        user_id: (context as any).userId as string,
        filename: data.filename,
        findings: unique as unknown as any,
      })
      .select("id")
      .single();

    return {
      scanId: saved?.id,
      filename: data.filename,
      findings: unique as unknown as any,
      summary: {
        total: unique.length,
        critical: unique.filter((f) => f.severity === "critical").length,
        high: unique.filter((f) => f.severity === "high").length,
        medium: unique.filter((f) => f.severity === "medium").length,
        low: unique.filter((f) => f.severity === "low").length,
        riskScore,
        owaspCategories: [...new Set(unique.map((f) => f.owasp).filter(Boolean))],
      },
    };
  });

// ─── Generate SARIF Report ───────────────────────────────────────────────────

export const generateSARIF = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ scanId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: scan } = await supabaseAdmin
      .from("scan_results")
      .select("*")
      .eq("id", data.scanId)
      .eq("user_id", (context as any).userId as string)
      .single();

    if (!scan) throw new Error("Scan not found");

    const findings = scan.findings as unknown as ScanFinding[];

    const sarif = {
      $schema:
        "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "StraxonSecure Scanner",
              version: "2.0.0",
              informationUri: "https://straxon.io",
              rules: OWASP_CHECKS.map((c) => ({
                id: c.id,
                name: c.title,
                shortDescription: { text: c.title },
                fullDescription: { text: c.description },
                help: { text: c.recommendation, markdown: `**Fix**: ${c.recommendation}` },
                properties: { tags: ["security", `owasp:${c.owasp}`] },
              })),
            },
          },
          results: findings.map((f) => ({
            ruleId: f.id.split("-L")[0],
            level:
              f.severity === "critical" || f.severity === "high"
                ? "error"
                : f.severity === "medium"
                  ? "warning"
                  : "note",
            message: { text: f.description },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: scan.filename },
                  region: f.line ? { startLine: f.line } : undefined,
                },
              },
            ],
          })),
        },
      ],
    };

    return { sarif: JSON.stringify(sarif, null, 2) };
  });

// ─── Scan History ────────────────────────────────────────────────────────────

export const getScanHistory = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("scan_results")
      .select("id, filename, created_at, findings")
      .eq("user_id", (context as any).userId as string)
      .order("created_at", { ascending: false })
      .limit(20);

    return { scans: data ?? [] };
  });
