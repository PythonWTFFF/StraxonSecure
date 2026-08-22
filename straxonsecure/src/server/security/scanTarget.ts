import dns from "node:dns";
import { promisify } from "node:util";

const lookup = promisify(dns.lookup);

// IP block checking helpers
function ipToNum(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  return (ipToNum(ip) & mask) === (ipToNum(range) & mask);
}

// Check for IPv4-mapped IPv6 addresses like ::ffff:192.168.1.1
function extractIPv4FromIPv6(ip: string): string | null {
  const match = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return match ? match[1] : null;
}

export async function assertSafeScanTarget(targetUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid protocol. Only HTTP and HTTPS are allowed.");
  }

  // Allow-list for legitimate internal engagements could be injected here based on context
  // if (process.env.ALLOW_INTERNAL_SCANS === "true") return parsed.hostname;

  const hostname = parsed.hostname;

  // Resolve the hostname to an IP to prevent DNS rebinding or obfuscation
  let address: string;
  try {
    const res = await lookup(hostname);
    address = res.address;
  } catch (e) {
    throw new Error("Failed to resolve hostname");
  }

  // Normalize IPv6-mapped IPv4
  const ipv4Match = extractIPv4FromIPv6(address);
  if (ipv4Match) {
    address = ipv4Match;
  }

  const isIPv4 = address.includes(".");

  if (isIPv4) {
    if (
      address === "127.0.0.1" ||
      address === "169.254.169.254" || // Cloud Metadata
      isIpInCidr(address, "10.0.0.0/8") ||
      isIpInCidr(address, "172.16.0.0/12") ||
      isIpInCidr(address, "192.168.0.0/16") ||
      isIpInCidr(address, "169.254.0.0/16") ||
      isIpInCidr(address, "127.0.0.0/8") ||
      address === "0.0.0.0"
    ) {
      throw new Error(`Target resolved to a restricted internal IP address: ${address}`);
    }
  } else {
    // IPv6 checks
    if (
      address === "::1" || // Loopback
      address.toLowerCase().startsWith("fe80:") || // Link-local
      address.toLowerCase().startsWith("fd") || // Unique local address
      address.toLowerCase().startsWith("fc")
    ) {
      throw new Error(`Target resolved to a restricted internal IPv6 address: ${address}`);
    }
  }

  // Return the resolved IP to pin it and prevent DNS rebinding attacks on subsequent requests
  return address;
}
