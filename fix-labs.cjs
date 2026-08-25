const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "src/routes");
const files = fs.readdirSync(routesDir).filter((f) => f.startsWith("labs.") && f.endsWith(".tsx"));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Relax LogEntry level type safely
  content = content.replace(
    /type\s+LogEntry\s*=\s*\{([^}]+)level\s*:\s*(?:"error"\s*\|\s*"warn"\s*\|\s*"info"\s*\|\s*"ok"|'error'\s*\|\s*'warn'\s*\|\s*'info'\s*\|\s*'ok')([^}]*)\}/g,
    "type LogEntry = {$1level: string$2}",
  );

  // Also if it's optional level?: ...
  content = content.replace(
    /type\s+LogEntry\s*=\s*\{([^}]+)level\?\s*:\s*(?:"error"\s*\|\s*"warn"\s*\|\s*"info"\s*\|\s*"ok"|'error'\s*\|\s*'warn'\s*\|\s*'info'\s*\|\s*'ok')([^}]*)\}/g,
    "type LogEntry = {$1level?: string$2}",
  );

  // Fix the specific XXE bug where union doesn't have attack
  if (file === "labs.xxe.tsx") {
    content = content.replace(
      "const res = secure ? parseSafeXML(xml) : parseVulnerableXML(xml);",
      "const res: any = secure ? parseSafeXML(xml) : parseVulnerableXML(xml);",
    );
  }

  fs.writeFileSync(filePath, content, "utf-8");
}
console.log("Fixed labs.");
