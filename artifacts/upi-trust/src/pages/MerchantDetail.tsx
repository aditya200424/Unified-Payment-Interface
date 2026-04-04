import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetMerchant, getGetMerchantQueryKey, useReportFraud } from "@workspace/api-client-react";
import { ShieldCheck, AlertTriangle, Info, ArrowRight, Activity, TrendingUp, CheckCircle, ExternalLink, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function MerchantDetail() {
  const [, params] = useRoute("/merchants/:upiId");
  const upiId = params?.upiId ? decodeURIComponent(params.upiId) : "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showFraudDialog, setShowFraudDialog] = useState(false);
  const [fraudReason, setFraudReason] = useState("");

  const { data: merchant, isLoading, error } = useGetMerchant(upiId, {
    query: {
      enabled: !!upiId,
      queryKey: getGetMerchantQueryKey(upiId),
      retry: false
    }
  });

  const reportFraudMutation = useReportFraud();

  const handleReportFraud = () => {
    if (!fraudReason.trim()) return;
    
    // Generate a random reporter ID for the demo
    const reporterUpiId = `user${Math.floor(Math.random() * 10000)}@upi`;
    
    reportFraudMutation.mutate({
      upiId,
      data: {
        reporterUpiId,
        reason: fraudReason
      }
    }, {
      onSuccess: () => {
        setShowFraudDialog(false);
        setFraudReason("");
        toast({
          title: "Report Submitted",
          description: "Your fraud report has been recorded. This will impact the merchant's trust score.",
          variant: "destructive"
        });
        queryClient.invalidateQueries({ queryKey: getGetMerchantQueryKey(upiId) });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Merchant Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The UPI ID "{upiId}" does not exist in our trust registry. Be careful when sending money to unknown IDs.
        </p>
        <Link href="/" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 hover:bg-primary/90 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isSafe = merchant.riskLevel === "Safe";
  const isRisky = merchant.riskLevel === "Risky";
  
  const riskColorClass = isSafe ? "text-safe" : isRisky ? "text-destructive" : "text-warning";
  const riskBgClass = isSafe ? "bg-safe/10 border-safe/20" : isRisky ? "bg-destructive/10 border-destructive/20" : "bg-warning/10 border-warning/20";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{merchant.name}</h1>
            {merchant.isVerified && (
              <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          <p className="text-xl font-mono text-muted-foreground">{merchant.upiId}</p>
        </div>
        <Link 
          href={`/merchants/${encodeURIComponent(merchant.upiId)}/pay`}
          className={`inline-flex items-center justify-center w-full md:w-auto h-14 px-8 text-lg rounded-full shadow-md gap-2 font-medium transition-colors ${
            isRisky ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          Pay Now <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Main Trust Score Card */}
      <Card className={`mb-8 border-2 ${riskBgClass}`}>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Trust Score</h2>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className={`text-6xl font-extrabold ${riskColorClass}`}>
                  {merchant.trustScore.toFixed(1)}
                </span>
                <span className="text-3xl text-muted-foreground">/ 5</span>
              </div>
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <Badge variant={isSafe ? "safe" : isRisky ? "risky" : "warning"} className="text-sm px-3 py-1 uppercase tracking-widest">
                  {merchant.riskLevel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Based on {merchant.totalTransactions.toLocaleString()} transactions
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 space-y-5 bg-background/50 p-6 rounded-xl border border-border/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Customer Satisfaction</span>
                  <span className="font-bold">{merchant.satisfactionPercent}%</span>
                </div>
                <Progress value={merchant.satisfactionPercent} className="h-3" />
              </div>
              
              <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Happy Transactions</span>
                <span className="font-medium text-safe">{merchant.happyTransactions.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fraud Reports</span>
                <span className={`font-medium ${merchant.fraudReports > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {merchant.fraudReports.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Formula Info */}
      <Alert className="mb-8 bg-muted/50 border-muted">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-foreground font-semibold">How is this score calculated?</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-2">
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <span className="bg-background px-2 py-1 rounded-md border font-mono">
              (Happy Txns / Total Txns) × 5
            </span>
            <span>minus penalties for verified fraud reports. Score updates in real-time after every payment.</span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Merchant Details
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowFraudDialog(true)}>
              <Flag className="h-4 w-4 mr-2" /> Report Fraud
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium text-right">{merchant.category}</div>
              
              <div className="text-muted-foreground">Joined</div>
              <div className="font-medium text-right">{new Date(merchant.createdAt).toLocaleDateString()}</div>
              
              <div className="text-muted-foreground">Verification</div>
              <div className="font-medium text-right">{merchant.isVerified ? "Platform Verified" : "Community Rated"}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Deep Analytics
            </CardTitle>
            <CardDescription>View detailed weekly trends and community feedback.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link 
              href={`/merchants/${encodeURIComponent(merchant.upiId)}/stats`} 
              className="w-full inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Detailed Stats <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Fraud Report Dialog */}
      <Dialog open={showFraudDialog} onOpenChange={setShowFraudDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Fraudulent Activity</DialogTitle>
            <DialogDescription>
              If you have experienced fraud or suspicious behavior with this merchant, please describe it below. False reports are monitored.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Provide details about the suspicious activity..."
              value={fraudReason}
              onChange={(e) => setFraudReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFraudDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReportFraud}
              disabled={!fraudReason.trim() || reportFraudMutation.isPending}
            >
              {reportFraudMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
