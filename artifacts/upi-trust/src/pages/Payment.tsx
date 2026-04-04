import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetMerchant, getGetMerchantQueryKey, useSubmitVote } from "@workspace/api-client-react";
import { Lock, ShieldCheck, Check, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const [, params] = useRoute("/merchants/:upiId/pay");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const upiId = params?.upiId ? decodeURIComponent(params.upiId) : "";

  const { data: merchant } = useGetMerchant(upiId, {
    query: { enabled: !!upiId, queryKey: getGetMerchantQueryKey(upiId) }
  });

  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [showVotePopup, setShowVotePopup] = useState(false);
  
  // Voting state
  const [isTransactionSafe, setIsTransactionSafe] = useState<string>("yes");
  const [didMerchantBehave, setDidMerchantBehave] = useState<string>("yes");
  const [isSatisfied, setIsSatisfied] = useState<string>("yes");
  
  const submitVoteMutation = useSubmitVote();

  const handlePinClick = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };
  const handleBackspace = () => setPin(pin.slice(0, -1));

  const handlePay = () => {
    if (pin.length !== 4) return;
    
    setPaymentStatus("processing");
    setIsProcessing(true);
    
    // Simulate network delay for payment
    setTimeout(() => {
      setPaymentStatus("success");
      setIsProcessing(false);
      
      // Show vote popup after brief delay
      setTimeout(() => {
        setShowVotePopup(true);
      }, 1500);
    }, 1500);
  };

  const handleSubmitVote = () => {
    // Generate a random voter ID for the demo
    const voterUpiId = `user${Math.floor(Math.random() * 10000)}@upi`;
    
    submitVoteMutation.mutate({
      upiId,
      data: {
        voterUpiId,
        isTransactionSafe: isTransactionSafe === "yes",
        didMerchantBehave: didMerchantBehave === "yes",
        isSatisfied: isSatisfied === "yes",
        isHappy: isTransactionSafe === "yes" && isSatisfied === "yes"
      }
    }, {
      onSuccess: () => {
        setShowVotePopup(false);
        toast({
          title: "Vote submitted",
          description: "Thank you for helping keep the community safe!",
          variant: "default",
        });
        setLocation(`/merchants/${encodeURIComponent(upiId)}`);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: "Failed to submit vote.",
          variant: "destructive",
        });
      }
    });
  };

  if (!merchant) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      
      {paymentStatus !== "success" ? (
        <Card className="border-border shadow-xl animate-in fade-in zoom-in-95 duration-300">
          <CardHeader className="text-center pb-2 bg-primary/5 rounded-t-xl border-b">
            <CardTitle className="text-xl">Paying</CardTitle>
            <div className="font-bold text-2xl mt-2">{merchant.name}</div>
            <div className="text-muted-foreground font-mono text-sm">{merchant.upiId}</div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-8">
              <div className="flex justify-center items-center gap-4 mb-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Enter 4-digit UPI PIN</span>
              </div>
              <div className="flex justify-center gap-3 my-6">
                {[0, 1, 2, 3].map((index) => (
                  <div 
                    key={index}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all
                      ${pin.length > index ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-sm' : 'border-border bg-card'}`}
                  >
                    {pin.length > index ? "•" : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button 
                  key={num} 
                  variant="outline" 
                  className="h-14 text-xl rounded-xl hover:bg-muted"
                  onClick={() => handlePinClick(num.toString())}
                  disabled={isProcessing}
                >
                  {num}
                </Button>
              ))}
              <Button 
                variant="outline" 
                className="h-14 text-xl rounded-xl hover:bg-muted col-start-2"
                onClick={() => handlePinClick("0")}
                disabled={isProcessing}
              >
                0
              </Button>
              <Button 
                variant="ghost" 
                className="h-14 text-xl rounded-xl text-muted-foreground"
                onClick={handleBackspace}
                disabled={isProcessing || pin.length === 0}
              >
                ⌫
              </Button>
            </div>

            <Button 
              className="w-full h-14 text-lg rounded-xl shadow-md"
              disabled={pin.length !== 4 || isProcessing}
              onClick={handlePay}
            >
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-safe/20 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-safe/20 rounded-full animate-ping opacity-75"></div>
            <Check className="h-12 w-12 text-safe relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground text-center mb-8">
            Paid securely to {merchant.name}
          </p>
        </div>
      )}

      <Dialog open={showVotePopup} onOpenChange={setShowVotePopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl">Help the Community</DialogTitle>
            <DialogDescription className="text-center">
              Your feedback directly impacts {merchant.name}'s TrustScore.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base">1. Was this transaction safe?</Label>
              <RadioGroup value={isTransactionSafe} onValueChange={setIsTransactionSafe} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-primary cursor-pointer transition-colors" onClick={() => setIsTransactionSafe("yes")}>
                  <RadioGroupItem value="yes" id="safe-yes" />
                  <Label htmlFor="safe-yes" className="cursor-pointer">Yes, Safe</Label>
                </div>
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-destructive cursor-pointer transition-colors" onClick={() => setIsTransactionSafe("no")}>
                  <RadioGroupItem value="no" id="safe-no" />
                  <Label htmlFor="safe-no" className="cursor-pointer">No, Suspicious</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base">2. Did merchant behave correctly?</Label>
              <RadioGroup value={didMerchantBehave} onValueChange={setDidMerchantBehave} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-primary cursor-pointer transition-colors" onClick={() => setDidMerchantBehave("yes")}>
                  <RadioGroupItem value="yes" id="behave-yes" />
                  <Label htmlFor="behave-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-destructive cursor-pointer transition-colors" onClick={() => setDidMerchantBehave("no")}>
                  <RadioGroupItem value="no" id="behave-no" />
                  <Label htmlFor="behave-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base">3. Are you satisfied?</Label>
              <RadioGroup value={isSatisfied} onValueChange={setIsSatisfied} className="flex gap-4">
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-primary cursor-pointer transition-colors" onClick={() => setIsSatisfied("yes")}>
                  <RadioGroupItem value="yes" id="sat-yes" />
                  <Label htmlFor="sat-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 bg-card border rounded-lg p-3 flex-1 hover:border-destructive cursor-pointer transition-colors" onClick={() => setIsSatisfied("no")}>
                  <RadioGroupItem value="no" id="sat-no" />
                  <Label htmlFor="sat-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleSubmitVote}
              disabled={submitVoteMutation.isPending}
            >
              {submitVoteMutation.isPending ? "Submitting..." : "Submit Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
