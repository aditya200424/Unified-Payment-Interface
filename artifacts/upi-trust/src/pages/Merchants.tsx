import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { useGetMerchants, getGetMerchantsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Merchants() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");

  const { data: merchants, isLoading } = useGetMerchants({
    query: { queryKey: getGetMerchantsQueryKey() }
  });

  const filteredMerchants = merchants?.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.upiId.toLowerCase().includes(search.toLowerCase()) ||
                          m.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "All" || m.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchants Directory</h1>
          <p className="text-muted-foreground mt-1">Browse and verify merchants before paying.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search merchants..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="Safe">Safe</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Risky">Risky</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="w-full h-24 flex items-center p-4">
              <Skeleton className="h-12 w-12 rounded-full mr-4" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMerchants.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-lg border border-dashed">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No merchants found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters.</p>
            </div>
          ) : (
            filteredMerchants.map(merchant => (
              <Link key={merchant.id} href={`/merchants/${merchant.upiId}`}>
                <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                        {merchant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {merchant.name}
                          </h3>
                          {merchant.isVerified && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{merchant.upiId}</span>
                          <span>•</span>
                          <span>{merchant.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="font-medium flex items-center justify-end gap-1">
                          <span className="text-lg">{merchant.trustScore.toFixed(1)}</span>
                          <span className="text-amber-500">★</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {merchant.totalTransactions} transactions
                        </div>
                      </div>
                      
                      <Badge variant={merchant.riskLevel === "Safe" ? "safe" : merchant.riskLevel === "Medium" ? "warning" : "risky"} className="w-20 justify-center">
                        {merchant.riskLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
