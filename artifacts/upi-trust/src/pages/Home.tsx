import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Shield, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchUpiId, setSearchUpiId] = useState("");

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUpiId.trim()) {
      setLocation(`/merchants/${encodeURIComponent(searchUpiId.trim())}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Verify before you pay.
            <br />
            <span className="text-primary">TrustScore</span> makes it safe.
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
            Look up any merchant's UPI ID to see their community-verified trust score.
            Protect yourself from fraud and ensure your money goes to the right place.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full max-w-lg items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter UPI ID (e.g. rahul@upi)"
              className="pl-10 h-14 text-lg rounded-full border-2 focus-visible:ring-primary shadow-sm"
              value={searchUpiId}
              onChange={(e) => setSearchUpiId(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-8 rounded-full shadow-md font-medium">
            Look Up
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Merchants</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.totalMerchants.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Safe Merchants</CardTitle>
            <CheckCircle className="h-4 w-4 text-safe" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold text-safe">{summary?.safeMerchants.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Trust Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{summary?.averageTrustScore.toFixed(1)} <span className="text-lg text-muted-foreground">/ 5.0</span></div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fraud Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold text-destructive">{summary?.totalFraudReports.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Top Trusted Merchants</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary?.topTrustedMerchants.map((merchant) => (
              <Card 
                key={merchant.id} 
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
                onClick={() => setLocation(`/merchants/${merchant.upiId}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                      {merchant.name}
                      {merchant.isVerified && <CheckCircle className="h-4 w-4 text-primary" />}
                    </CardTitle>
                    <Badge variant="safe" className="font-bold">{merchant.trustScore.toFixed(1)} ★</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono mt-1">{merchant.upiId}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{merchant.category}</span>
                    <span className="font-medium text-safe">{merchant.satisfactionPercent}% satisfied</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {summary?.topTrustedMerchants.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No merchants found yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
