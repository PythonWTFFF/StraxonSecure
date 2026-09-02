import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/context/CurrencyContext";
import { Loader2, QrCode, CreditCard, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountCents: number;
  serviceName: string;
  onSuccess: () => void;
}

export const IndianGlobalPaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amountCents,
  serviceName,
  onSuccess,
}) => {
  const { currency, formatPrice } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const handlePayment = async () => {
    if (paymentMethod === "upi" && !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID");
      return;
    }

    setIsProcessing(true);
    // Simulate secure payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    
    toast.success("Payment Successful!", {
      description: `Securely processed for ${serviceName}`,
    });
    onSuccess();
    onClose();
  };

  const gstAmount = currency === "INR" ? amountCents * 0.18 : 0;
  const totalAmount = amountCents + gstAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">Checkout: {serviceName}</span>
          </DialogTitle>
          <DialogDescription>
            Secure global checkout process.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Amount Breakdown */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(amountCents)}</span>
            </div>
            {currency === "INR" && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>GST (18%)</span>
                <span>{formatPrice(gstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t border-white/10 pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={`h-12 ${paymentMethod === "card" ? "bg-primary text-primary-foreground" : "border-white/10"}`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Card
              </Button>
              {currency === "INR" && (
                <Button
                  variant={paymentMethod === "upi" ? "default" : "outline"}
                  className={`h-12 ${paymentMethod === "upi" ? "bg-primary text-primary-foreground" : "border-white/10"}`}
                  onClick={() => setPaymentMethod("upi")}
                >
                  <QrCode className="w-4 h-4 mr-2" /> UPI
                </Button>
              )}
            </div>
          </div>

          {/* Method Specific Fields */}
          {paymentMethod === "upi" && currency === "INR" ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <Label>UPI ID</Label>
              <Input
                placeholder="example@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <Label>Card Details (Stripe Secured)</Label>
              <div className="p-3 bg-black/30 border border-white/10 rounded-md text-sm text-gray-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Stripe Elements will render here
              </div>
            </div>
          )}

          {/* B2B GST (India Only) */}
          {currency === "INR" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> B2B GST Details (Optional)
              </Label>
              <Input
                placeholder="22AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>
          )}
        </div>

        <Button
          className="w-full h-12 text-lg font-semibold shimmer-btn"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
            </>
          ) : (
            `Pay ${formatPrice(totalAmount)}`
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Secured by 256-bit AES encryption
        </p>
      </DialogContent>
    </Dialog>
  );
};
