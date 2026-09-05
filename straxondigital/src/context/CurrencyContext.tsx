import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "INR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (cents: number) => string;
  usdToInrRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Using a stable peg for predictable SaaS pricing
const USD_TO_INR_RATE = 83.5;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem("straxon_currency") as Currency;
    if (saved === "USD" || saved === "INR") {
      setCurrencyState(saved);
      return;
    }

    // Auto-detect based on timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("Asia/Colombo")) {
        setCurrencyState("INR");
      }
    } catch (e) {
      // Fallback silently
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("straxon_currency", c);
  };

  const formatPrice = (cents: number) => {
    if (currency === "INR") {
      // Convert US cents to INR
      const inrValue = Math.round((cents / 100) * USD_TO_INR_RATE);
      return `₹${inrValue.toLocaleString("en-IN")}`;
    }
    // Default USD
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, usdToInrRate: USD_TO_INR_RATE }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
