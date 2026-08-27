import fs from "fs";
import path from "path";

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith(".ts")) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk("src/server");

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  
  if (!content.includes("logAudit")) continue;
  if (file.includes("audit.ts")) continue; // Skip the definition file

  let changed = false;
  
  if (content.match(/logAudit\(\s*\{/)) {
    content = content.replace(/logAudit\(\s*\{/g, "logAudit(context as ServerContext, {");
    changed = true;
  }

  if (content.match(/requestId:.*?,\n/g)) {
    content = content.replace(/\s*requestId:.*?,/g, "");
    changed = true;
  }
  if (content.match(/actorUserId:.*?,\n/g)) {
    content = content.replace(/\s*actorUserId:.*?,/g, "");
    changed = true;
  }
  if (content.match(/orgId:.*?,\n/g)) {
    content = content.replace(/\s*orgId:.*?,/g, "");
    changed = true;
  }
  if (content.match(/userId:.*?,\n/g)) {
    content = content.replace(/\s*userId:.*?,/g, "");
    changed = true;
  }

  if (changed && !content.includes("ServerContext")) {
    content = `import type { ServerContext } from "@/server/context";\n` + content;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  }
}
