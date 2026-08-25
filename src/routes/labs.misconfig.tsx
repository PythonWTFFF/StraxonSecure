import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame } from "@/components/labs/LabFrame";
import { ServerCrash, FolderOpen, KeyRound } from "lucide-react";

export const Route = createFileRoute("/labs/misconfig")({
  head: () => ({
    meta: [
      { title: "Misconfigured Server Lab — Straxon Secure" },
      {
        name: "description",
        content: "Exposed admin panels, default credentials, directory listing.",
      },
    ],
  }),
  component: MisconfigGated,
});

import { PremiumGate } from "@/components/PremiumGate";
function MisconfigGated() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      <PremiumGate
        feature="Misconfigured Server Lab"
        description="Pro unlocks the multi-step exposed admin panel & default-credential exploit walkthrough."
      >
        <MisconfigLab />
      </PremiumGate>
    </div>
  );
}

const FILES = [
  { name: ".env", size: "2.1 KB", danger: true },
  { name: "backup.sql", size: "412 MB", danger: true },
  { name: "config/db.yml", size: "1.4 KB", danger: true },
  { name: "logs/access.log", size: "8.2 MB", danger: false },
  { name: "uploads/", size: "—", danger: false },
  { name: "id_rsa", size: "3.2 KB", danger: true },
];

function MisconfigLab() {
  const [step, setStep] = useState<"scan" | "panel" | "loot">("scan");
  const [creds, setCreds] = useState({ u: "", p: "" });
  const [authed, setAuthed] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);

  const tryLogin = () => {
    if (creds.u === "admin" && creds.p === "admin") {
      setAuthed(true);
      setStep("loot");
    } else {
      alert("Wrong credentials. Hint: try the defaults.");
    }
  };

  return (
    <LabFrame title="MISCONFIGURED SERVER" badge="LAB-05" recorderLab="misconfig">
      <p className="text-muted-foreground max-w-3xl">
        Discover an exposed admin panel, login with default credentials, and browse a server with
        directory listing enabled.
      </p>

      <div className="flex gap-2 text-xs font-mono">
        {(["scan", "panel", "loot"] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-3 py-1.5 rounded uppercase tracking-wider border ${
              step === s
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === "scan" && (
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase text-primary mb-3">
            // PORT SCAN — straxon.target
          </div>
          <pre className="bg-background/60 border border-border rounded p-3 text-xs font-mono leading-relaxed">
            {`$ nmap -sV straxon.target
PORT     STATE  SERVICE        VERSION
22/tcp   open   ssh            OpenSSH 8.2
80/tcp   open   http           nginx 1.18.0
443/tcp  open   https          nginx 1.18.0
8080/tcp open   http-proxy     Apache Tomcat/Coyote
9000/tcp open   admin-panel    Webmin (default install)  ⚠️
27017/tcp open  mongodb        MongoDB 4.4 (no auth)     ⚠️
`}
          </pre>
          <CyberButton onClick={() => setStep("panel")} className="mt-3">
            Open admin panel @ :9000 →
          </CyberButton>
        </CyberCard>
      )}

      {step === "panel" && (
        <CyberCard variant="magenta">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-accent mb-3">
            <KeyRound className="h-4 w-4" /> straxon.target:9000 — Admin Login
          </div>
          {!authed ? (
            <div className="space-y-3 max-w-sm">
              <input
                placeholder="Username"
                value={creds.u}
                onChange={(e) => setCreds({ ...creds, u: e.target.value })}
                className="w-full bg-background/60 border border-border rounded px-3 py-2 font-mono"
              />
              <input
                type="password"
                placeholder="Password"
                value={creds.p}
                onChange={(e) => setCreds({ ...creds, p: e.target.value })}
                className="w-full bg-background/60 border border-border rounded px-3 py-2 font-mono"
              />
              <CyberButton onClick={tryLogin}>Sign in</CyberButton>
              <p className="text-xs text-muted-foreground font-mono">
                💡 Try common defaults: admin/admin, root/root, admin/password
              </p>
            </div>
          ) : (
            <div className="text-success font-mono">✓ Authenticated. Continue to step 3.</div>
          )}
        </CyberCard>
      )}

      {step === "loot" && (
        <>
          <CyberCard variant="magenta">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-destructive mb-3">
              <FolderOpen className="h-4 w-4" /> Directory listing — /var/www/html
            </div>
            <div className="space-y-1 font-mono text-sm">
              {FILES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setOpened(f.name)}
                  className={`flex items-center justify-between w-full px-3 py-1.5 rounded hover:bg-background/60 text-left ${
                    f.danger ? "text-destructive" : "text-foreground"
                  }`}
                >
                  <span>📄 {f.name}</span>
                  <span className="text-xs text-muted-foreground">{f.size}</span>
                </button>
              ))}
            </div>
          </CyberCard>

          {opened && (
            <CyberCard variant="cyan">
              <div className="text-xs font-mono uppercase text-primary mb-2">
                <ServerCrash className="inline h-4 w-4 mr-1" /> {opened}
              </div>
              <pre className="bg-background/60 border border-border rounded p-3 text-xs font-mono">
                {opened === ".env"
                  ? `DATABASE_URL=postgres://admin:S3cret@db.internal/prod
STRIPE_SECRET=sk_live_4242...
JWT_SECRET=hunter2_change_me
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/...`
                  : opened === "id_rsa"
                    ? `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAxz... [redacted full private key — game over]
-----END RSA PRIVATE KEY-----`
                    : opened === "backup.sql"
                      ? `-- backup of users table
INSERT INTO users VALUES (1,'admin','$2b$10$abc...','admin');
INSERT INTO users VALUES (2,'alice','$2b$10$xyz...','user');
-- 412MB of customer data follows...`
                      : "(file content)"}
              </pre>
            </CyberCard>
          )}
        </>
      )}

      <CyberCard variant="magenta">
        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">// FIX</div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            Disable directory listing (<span className="font-mono">autoindex off</span>).
          </li>
          <li>Never deploy with default credentials. Force a setup wizard.</li>
          <li>Move admin panels behind VPN/auth proxy. Bind to localhost only.</li>
          <li>
            Keep <span className="font-mono">.env</span>,{" "}
            <span className="font-mono">backup.sql</span>, and SSH keys outside web root.
          </li>
          <li>Run regular CIS benchmark scans.</li>
        </ul>
      </CyberCard>
    </LabFrame>
  );
}
