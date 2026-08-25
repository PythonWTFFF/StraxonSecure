import { describe, it, expect } from "vitest";
import { assertSafeScanTarget } from "./scanTarget";

describe("assertSafeScanTarget", () => {
  it("allows normal public IPs and domains", async () => {
    await expect(assertSafeScanTarget("https://google.com")).resolves.not.toThrow();
    await expect(assertSafeScanTarget("http://8.8.8.8")).resolves.not.toThrow();
    await expect(assertSafeScanTarget("https://github.com/path")).resolves.not.toThrow();
  });

  it("rejects RFC1918 private ranges", async () => {
    await expect(assertSafeScanTarget("http://10.0.0.1")).rejects.toThrow();
    await expect(assertSafeScanTarget("http://192.168.1.1")).rejects.toThrow();
    await expect(assertSafeScanTarget("http://172.16.0.5")).rejects.toThrow();
  });

  it("rejects loopback addresses", async () => {
    await expect(assertSafeScanTarget("http://127.0.0.1")).rejects.toThrow();
    await expect(assertSafeScanTarget("http://localhost")).rejects.toThrow();
    // Alternative loopback
    await expect(assertSafeScanTarget("http://127.0.0.50")).rejects.toThrow();
  });

  it("rejects cloud metadata IPs", async () => {
    await expect(assertSafeScanTarget("http://169.254.169.254")).rejects.toThrow();
  });

  it("rejects IPv6-mapped IPv4 loopback addresses", async () => {
    await expect(assertSafeScanTarget("http://[::ffff:127.0.0.1]")).rejects.toThrow();
  });

  it("rejects local domains like .local and .internal", async () => {
    await expect(assertSafeScanTarget("http://my-service.local")).rejects.toThrow();
    await expect(assertSafeScanTarget("http://admin.internal")).rejects.toThrow();
  });

  it("prevents DNS rebinding by returning a pinned IP address", async () => {
    // assertSafeScanTarget relies on dns.lookup.
    // By returning the resolved IP, it forces the caller to use the IP, bypassing subsequent DNS lookups.
    const ip = await assertSafeScanTarget("https://google.com");
    // The returned value should be an IPv4 or IPv6 string, not the domain name.
    expect(ip).toMatch(/^[0-9a-f:.]+$/i);
    expect(ip).not.toEqual("google.com");
  });
});
