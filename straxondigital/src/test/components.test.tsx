import { describe, it, expect } from "vitest";
import * as LucideIcons from "lucide-react";

// Check all components
import { Navbar } from "@/components/Navbar";
import { NetworkGlobe } from "@/components/NetworkGlobe";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceCustomizerDialog } from "@/components/ServiceCustomizerDialog";
import { SaaSPricingSection } from "@/components/SaaSPricingSection";
import { BundlesSection } from "@/components/BundlesSection";
import { LeadGrader } from "@/components/LeadGrader";
import { Footer } from "@/components/Footer";
import { HeroStats } from "@/components/HeroStats";
import { FeatureGrid } from "@/components/FeatureGrid";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { DemoWidget } from "@/components/DemoWidget";
import { MagneticButton } from "@/components/MagneticButton";
import { ServicesMegaMenu } from "@/components/ServicesMegaMenu";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { DashboardUpsell } from "@/components/DashboardUpsell";
import { OnboardingConcierge } from "@/components/OnboardingConcierge";
import { ClientProfitCenter } from "@/components/ClientProfitCenter";
import { AutomationsHub } from "@/components/AutomationsHub";
import { AffiliateHub } from "@/components/AffiliateHub";
import { AgencyLeadMagnet } from "@/components/AgencyLeadMagnet";
import { BillingTab } from "@/components/BillingTab";
import { WorkspacePanel } from "@/components/WorkspacePanel";
import { OrderActions } from "@/components/OrderActions";
import { RevenueAnalyticsBrain } from "@/components/RevenueAnalyticsBrain";
import { EmailDigestEngine } from "@/components/EmailDigestEngine";
import { ClientReportGenerator } from "@/components/ClientReportGenerator";
import { ContentEngine } from "@/components/ContentEngine";
import { DripCampaignGenerator } from "@/components/DripCampaignGenerator";
import { CompetitorTracker } from "@/components/CompetitorTracker";
import { SocialMediaEngine } from "@/components/SocialMediaEngine";
import { PricingOptimizer } from "@/components/PricingOptimizer";
import { ReviewEngine } from "@/components/ReviewEngine";
import { SecurityCenter } from "@/components/SecurityCenter";
import { RagVectorStudio } from "@/components/RagVectorStudio";
import { GstInvoiceGenerator } from "@/components/GstInvoiceGenerator";
import { IndianGlobalPaymentModal } from "@/components/IndianGlobalPaymentModal";

// Pages
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Auth from "@/pages/Auth";
import Checkout from "@/pages/Checkout";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import PublicView from "@/pages/PublicView";
import ResetPassword from "@/pages/ResetPassword";
import Pricing from "@/pages/Pricing";
import Automations from "@/pages/Automations";
import Affiliates from "@/pages/Affiliates";
import Reseller from "@/pages/Reseller";
import ReportView from "@/pages/ReportView";

describe("Component and Page Export Validation", () => {
  const components: Record<string, any> = {
    Navbar,
    NetworkGlobe,
    RevenueCalculator,
    ServiceCard,
    ServiceCustomizerDialog,
    SaaSPricingSection,
    BundlesSection,
    LeadGrader,
    Footer,
    HeroStats,
    FeatureGrid,
    TestimonialsSection,
    DemoWidget,
    MagneticButton,
    ServicesMegaMenu,
    AnimatedCounter,
    DashboardUpsell,
    OnboardingConcierge,
    ClientProfitCenter,
    AutomationsHub,
    AffiliateHub,
    AgencyLeadMagnet,
    BillingTab,
    WorkspacePanel,
    OrderActions,
    RevenueAnalyticsBrain,
    EmailDigestEngine,
    ClientReportGenerator,
    ContentEngine,
    DripCampaignGenerator,
    CompetitorTracker,
    SocialMediaEngine,
    PricingOptimizer,
    ReviewEngine,
    SecurityCenter,
    RagVectorStudio,
    GstInvoiceGenerator,
    IndianGlobalPaymentModal,
    Home,
    Services,
    Auth,
    Checkout,
    Dashboard,
    Admin,
    Contact,
    NotFound,
    PublicView,
    ResetPassword,
    Pricing,
    Automations,
    Affiliates,
    Reseller,
    ReportView,
  };

  for (const [name, comp] of Object.entries(components)) {
    it(`should ensure ${name} is defined and valid React component`, () => {
      expect(comp, `Component ${name} is undefined!`).toBeDefined();
      expect(
        typeof comp === "function" || (typeof comp === "object" && comp !== null),
        `Component ${name} is not a valid React component type: ${typeof comp}`
      ).toBe(true);
    });
  }
});
