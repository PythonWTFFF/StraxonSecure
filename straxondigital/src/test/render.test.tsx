import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrencyProvider } from "@/context/CurrencyContext";

// Components to render
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroStats } from "@/components/HeroStats";
import { FeatureGrid } from "@/components/FeatureGrid";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { SaaSPricingSection } from "@/components/SaaSPricingSection";
import { BundlesSection } from "@/components/BundlesSection";
import { ServicesMegaMenu } from "@/components/ServicesMegaMenu";

// Mock matchMedia and resizeObserver if needed
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

// Pages to render
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Services from "@/pages/Services";
import Pricing from "@/pages/Pricing";
import Automations from "@/pages/Automations";
import Affiliates from "@/pages/Affiliates";
import Reseller from "@/pages/Reseller";
import Dashboard from "@/pages/Dashboard";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";

describe("Component Rendering Smoke Test", () => {
  it("renders Navbar without throwing", () => {
    expect(() => renderWithProviders(<Navbar />)).not.toThrow();
  });

  it("renders ServicesMegaMenu open without throwing undefined component error", () => {
    expect(() => renderWithProviders(<ServicesMegaMenu isOpen={true} />)).not.toThrow();
  });

  it("renders Footer without throwing", () => {
    expect(() => renderWithProviders(<Footer />)).not.toThrow();
  });

  it("renders HeroStats without throwing", () => {
    expect(() => renderWithProviders(<HeroStats />)).not.toThrow();
  });

  it("renders FeatureGrid without throwing", () => {
    expect(() => renderWithProviders(<FeatureGrid />)).not.toThrow();
  });

  it("renders TestimonialsSection without throwing", () => {
    expect(() => renderWithProviders(<TestimonialsSection />)).not.toThrow();
  });

  it("renders RevenueCalculator without throwing", () => {
    expect(() => renderWithProviders(<RevenueCalculator />)).not.toThrow();
  });

  it("renders SaaSPricingSection without throwing", () => {
    expect(() => renderWithProviders(<SaaSPricingSection />)).not.toThrow();
  });

  it("renders BundlesSection without throwing", () => {
    expect(() => renderWithProviders(<BundlesSection />)).not.toThrow();
  });

  it("renders Home page without throwing", () => {
    expect(() => renderWithProviders(<Home />)).not.toThrow();
  });

  it("renders Auth page without throwing", () => {
    expect(() => renderWithProviders(<Auth />)).not.toThrow();
  });

  it("renders Services page without throwing", () => {
    expect(() => renderWithProviders(<Services />)).not.toThrow();
  });

  it("renders Pricing page without throwing", () => {
    expect(() => renderWithProviders(<Pricing />)).not.toThrow();
  });

  it("renders Automations page without throwing", () => {
    expect(() => renderWithProviders(<Automations />)).not.toThrow();
  });

  it("renders Affiliates page without throwing", () => {
    expect(() => renderWithProviders(<Affiliates />)).not.toThrow();
  });

  it("renders Reseller page without throwing", () => {
    expect(() => renderWithProviders(<Reseller />)).not.toThrow();
  });

  it("renders Dashboard page without throwing", () => {
    expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
  });

  it("renders Contact page without throwing", () => {
    expect(() => renderWithProviders(<Contact />)).not.toThrow();
  });

  it("renders NotFound page without throwing", () => {
    expect(() => renderWithProviders(<NotFound />)).not.toThrow();
  });

  it("renders ResetPassword page without throwing", () => {
    expect(() => renderWithProviders(<ResetPassword />)).not.toThrow();
  });
});
