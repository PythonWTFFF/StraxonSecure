"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/integrations/supabase/client.server.ts
var import_supabase_js = require("@supabase/supabase-js");
function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase server environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }
  if (SUPABASE_SERVICE_ROLE_KEY === process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_SERVICE_ROLE_KEY === process.env.SUPABASE_PUBLISHABLE_KEY) {
    console.warn("WARNING: Using PUBLISHABLE KEY for Supabase Admin. RLS bypass will not work!");
  }
  if (SUPABASE_URL.includes("6543")) {
    console.warn(
      "WARNING: Supabase URL is using port 6543 (Transaction Mode pooling). Since Straxon's Node SSR server is a persistent long-lived process, you should use Session Mode (port 5432) for optimal connection pooling."
    );
  }
  return (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
var _supabaseAdmin;
var supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  }
});

// src/server/webhooks.server.ts
var import_crypto2 = __toESM(require("crypto"), 1);

// src/server/security/scanTarget.ts
var import_node_dns = __toESM(require("node:dns"), 1);
var import_node_util = require("node:util");
var lookup = (0, import_node_util.promisify)(import_node_dns.default.lookup);
function ipToNum(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
function isIpInCidr(ip, cidr) {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  return (ipToNum(ip) & mask) === (ipToNum(range) & mask);
}
function extractIPv4FromIPv6(ip) {
  const match = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return match ? match[1] : null;
}
async function assertSafeScanTarget(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    throw new Error("Invalid URL format");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid protocol. Only HTTP and HTTPS are allowed.");
  }
  const hostname = parsed.hostname;
  let address;
  try {
    const res = await lookup(hostname);
    address = res.address;
  } catch (e) {
    throw new Error("Failed to resolve hostname");
  }
  const ipv4Match = extractIPv4FromIPv6(address);
  if (ipv4Match) {
    address = ipv4Match;
  }
  const isIPv4 = address.includes(".");
  if (isIPv4) {
    if (address === "127.0.0.1" || address === "169.254.169.254" || // Cloud Metadata
    isIpInCidr(address, "10.0.0.0/8") || isIpInCidr(address, "172.16.0.0/12") || isIpInCidr(address, "192.168.0.0/16") || isIpInCidr(address, "169.254.0.0/16") || isIpInCidr(address, "127.0.0.0/8") || address === "0.0.0.0") {
      throw new Error(`Target resolved to a restricted internal IP address: ${address}`);
    }
  } else {
    if (address === "::1" || // Loopback
    address.toLowerCase().startsWith("fe80:") || // Link-local
    address.toLowerCase().startsWith("fd") || // Unique local address
    address.toLowerCase().startsWith("fc")) {
      throw new Error(`Target resolved to a restricted internal IPv6 address: ${address}`);
    }
  }
  return address;
}

// src/server/security/encryption.ts
var import_crypto = __toESM(require("crypto"), 1);
var ALGORITHM = "aes-256-gcm";
var ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || import_crypto.default.randomBytes(32).toString("hex");
function decrypt(text) {
  try {
    const parts = text.split(":");
    if (parts.length !== 3) return text;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = import_crypto.default.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const decipher = import_crypto.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return text;
  }
}

// src/server/webhooks.server.ts
async function triggerWebhooks(userId, eventType, payload) {
  const { data: webhooks, error } = await supabaseAdmin.from("webhooks").select("*").eq("user_id", userId).eq("active", true);
  if (error || !webhooks || webhooks.length === 0) return;
  const eventPayload = JSON.stringify({
    event: eventType,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    data: payload
  });
  const promises = webhooks.map(async (wh) => {
    try {
      await assertSafeScanTarget(wh.url);
      const secret = decrypt(wh.secret);
      const signature = import_crypto2.default.createHmac("sha256", secret).update(eventPayload).digest("hex");
      let bodyPayload = eventPayload;
      if (wh.url.includes("hooks.slack.com") || wh.url.includes("discord.com/api/webhooks")) {
        bodyPayload = JSON.stringify({
          text: `\u{1F6A8} *Straxon Secure Alert: ${payload.threatLevel?.toUpperCase() || "NEW"} Threat Detected* \u{1F6A8}

*Process:* \`${payload.processName || "Unknown"}\`
*Analysis:* ${payload.analysis || "No analysis provided."}`
        });
      }
      await fetch(wh.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Straxon-Signature": signature,
          "User-Agent": "Straxon-Webhook-Engine/1.0"
        },
        body: bodyPayload
      });
    } catch (err) {
      console.error(`Failed to trigger webhook ${wh.url}:`, err);
    }
  });
  await Promise.allSettled(promises);
}

// trigger_webhook.ts
async function testWebhook() {
  const userId = "5e04bfbf-5df2-485a-8e87-5572c7dac351";
  console.log(`Triggering webhook for user: ${userId}`);
  await triggerWebhooks(userId, "test.anomaly", {
    threatLevel: "critical",
    processName: "test_process.exe",
    analysis: "This is a test anomaly detected via Straxon AI engine!"
  });
  console.log("Triggered!");
}
testWebhook();
