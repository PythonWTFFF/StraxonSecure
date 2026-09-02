import React from "react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/CurrencyContext";
import { IndianRupee, DollarSign } from "lucide-react";

export const CurrencyToggle = () => {
  const { currency, setCurrency } = useCurrency();

  const toggleCurrency = () => {
    setCurrency(currency === "USD" ? "INR" : "USD");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCurrency}
      className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-full px-3 py-1 text-sm font-medium"
    >
      <span className={`flex items-center justify-center w-5 h-5 rounded-full ${currency === "USD" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}>
        <DollarSign className="w-3.5 h-3.5" />
      </span>
      <span className={`flex items-center justify-center w-5 h-5 rounded-full ${currency === "INR" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}>
        <IndianRupee className="w-3.5 h-3.5" />
      </span>
    </Button>
  );
};
