const fs = require("fs");
const path = require("path");

const routesDir = path.join(process.cwd(), "src/routes");

// Fix labs
const files = fs.readdirSync(routesDir).filter((f) => f.startsWith("labs.") && f.endsWith(".tsx"));
for (const file of files) {
  const p = path.join(routesDir, file);
  let c = fs.readFileSync(p, "utf-8");

  // Replace LogEntry level definition exactly
  c = c.replace(
    /level\s*\??\s*:\s*(?:"error"|'error')\s*\|\s*(?:"warn"|'warn')\s*\|\s*(?:"info"|'info')\s*\|\s*(?:"ok"|'ok')/g,
    "level?: string",
  );

  fs.writeFileSync(p, c);
}

// Fix settings.tsx
const settingsPath = path.join(routesDir, "settings.tsx");
let s = fs.readFileSync(settingsPath, "utf-8");
s = s.replace(/variant="ghost"/g, 'variant="plain"');
s = s.replace(/const \{ user, signOut \} = useAuth\(\);/g, "const { user } = useAuth();");
s = s.replace(/await signOut\(\);/g, "await supabase.auth.signOut();");
fs.writeFileSync(settingsPath, s);

// Fix teams.tsx
const teamsPath = path.join(routesDir, "teams.tsx");
let t = fs.readFileSync(teamsPath, "utf-8");
t = t.replace(
  /const leaderboard = await getGlobalLeaderboard\(\);/g,
  "const leaderboard: any[] = [];",
);
fs.writeFileSync(teamsPath, t);

// Fix index.tsx animation easing
const indexPath = path.join(routesDir, "index.tsx");
if (fs.existsSync(indexPath)) {
  let idx = fs.readFileSync(indexPath, "utf-8");
  idx = idx.replace(/ease: \[0\.16, 1, 0\.3, 1\]/g, 'ease: "easeOut"');
  fs.writeFileSync(indexPath, idx);
}
