import { describe, it, expect } from "vitest";
import {
  SERVICES,
  calculateCustomPrice,
  findService,
  findBundle,
  BUNDLES,
  PROMO_CODES,
  ORDER_BUMPS,
  applyDiscount,
  PACKAGE_TIERS,
  GLOBAL_ADDONS,
} from "@/lib/services";

describe("Services Catalog & Customizer Engine", () => {
  it("should have all 16 services properly configured with deliverables and intake fields", () => {
    expect(SERVICES.length).toBe(16);
    SERVICES.forEach((service) => {
      expect(service.slug).toBeTruthy();
      expect(service.name).toBeTruthy();
      expect(service.priceCents).toBeGreaterThan(0);
      expect(service.turnaround).toBeTruthy();
      expect(service.deliverables.length).toBeGreaterThan(0);
      expect(service.intake.length).toBeGreaterThan(0);
    });
  });

  it("should find services by slug", () => {
    const resume = findService("executive-resume");
    expect(resume).toBeDefined();
    expect(resume?.type).toBe("resume");

    const saas = findService("saas-architecture");
    expect(saas).toBeDefined();
    expect(saas?.type).toBe("saas-architecture");

    const voice = findService("ai-voice-automations");
    expect(voice).toBeDefined();
    expect(voice?.type).toBe("ai-voice-automations");
  });

  it("should calculate custom pricing accurately based on tier and add-ons", () => {
    const baseCents = 10000; // $100.00
    // Starter tier (1.0x) with no add-ons
    const starter = calculateCustomPrice(baseCents, "starter", []);
    expect(starter.totalCents).toBe(10000);
    expect(starter.tierCents).toBe(10000);
    expect(starter.addonsCents).toBe(0);

    // Pro tier (1.6x)
    const pro = calculateCustomPrice(baseCents, "pro", []);
    expect(pro.tierCents).toBe(16000);

    // Enterprise tier (2.5x)
    const enterprise = calculateCustomPrice(baseCents, "enterprise", []);
    expect(enterprise.tierCents).toBe(25000);

    // With rush delivery (+$49.00 = 4900 cents)
    const withRush = calculateCustomPrice(baseCents, "starter", ["rush-delivery"]);
    expect(withRush.totalCents).toBe(14900);
    expect(withRush.addonsCents).toBe(4900);

    // Pro tier with 2 add-ons: rush delivery ($49) + raw assets ($69)
    const proWithAddons = calculateCustomPrice(baseCents, "pro", [
      "rush-delivery",
      "raw-assets",
    ]);
    expect(proWithAddons.tierCents).toBe(16000);
    expect(proWithAddons.addonsCents).toBe(4900 + 6900);
    expect(proWithAddons.totalCents).toBe(16000 + 4900 + 6900);
  });

  it("should have valid high-ticket turnkey bundles configured", () => {
    expect(BUNDLES.length).toBeGreaterThanOrEqual(3);
    const startupBundle = findBundle("startup-empire-bundle");
    expect(startupBundle).toBeDefined();
    expect(startupBundle?.bundlePriceCents).toBe(89900);
    expect(startupBundle?.savingsCents).toBeGreaterThan(0);
    expect(startupBundle?.includedServiceSlugs.length).toBeGreaterThanOrEqual(3);

    const careerSuite = findBundle("executive-career-suite");
    expect(careerSuite).toBeDefined();
    expect(careerSuite?.bundlePriceCents).toBe(19900);
  });

  it("should accurately apply percentage and fixed promo code discounts", () => {
    const originalCents = 10000; // $100.00

    // LAUNCH25 (25% off)
    const launch25 = applyDiscount(originalCents, "LAUNCH25");
    expect(launch25.promo).toBeDefined();
    expect(launch25.discountCents).toBe(2500);
    expect(launch25.finalCents).toBe(7500);

    // Case insensitivity
    const lowercase = applyDiscount(originalCents, "launch25");
    expect(lowercase.discountCents).toBe(2500);

    // FOUNDER50 ($50 flat off)
    const founder50 = applyDiscount(originalCents, "FOUNDER50");
    expect(founder50.discountCents).toBe(5000);
    expect(founder50.finalCents).toBe(5000);

    // Invalid code returns full price with null promo
    const invalid = applyDiscount(originalCents, "INVALIDCODE99");
    expect(invalid.promo).toBeNull();
    expect(invalid.discountCents).toBe(0);
    expect(invalid.finalCents).toBe(originalCents);
  });

  it("should provide high-margin checkout order bumps", () => {
    expect(ORDER_BUMPS.length).toBeGreaterThanOrEqual(2);
    ORDER_BUMPS.forEach((bump) => {
      expect(bump.id).toBeTruthy();
      expect(bump.priceCents).toBeGreaterThan(0);
      expect(bump.originalPriceCents).toBeGreaterThan(bump.priceCents);
    });
  });
});
