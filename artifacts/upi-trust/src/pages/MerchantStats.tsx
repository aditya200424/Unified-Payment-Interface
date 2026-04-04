import { useRoute, Link } from "wouter";
import { useGetMerchantStats, getGetMerchantStatsQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, TrendingUp, ThumbsUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function MerchantStats() {
  const [, params] = useRoute("/merchants/:upiId/stats");
  const upiId = params?.upiId ? decodeURIComponent(params.upiId) : "";

  const { data: stats, isLoading } = useGetMerchantStats(upiId, {
    query: { enabled: !!upiId, queryKey: getGetMerchantStatsQueryKey(upiId) }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!stats) return null;

  const chartData = stats.weeklyVotes.map(week => ({
    name: week.week.substring(5), // Shorten date string
    satisfaction: Math.round((week.happy / (week.total || 1)) * 100),
    total: week.total,
    happy: week.happy
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link 
          href={`/merchants/${encodeURIComponent(upiId)}`}
          className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors mb-4 gap-2 -ml-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Merchant
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Detailed Analytics</h1>
        <p className="text-muted-foreground text-lg">{stats.merchant.name} ({stats.merchant.upiId})</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Trust Score History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.merchant.trustScore.toFixed(1)} / 5.0</div>
            <p className="text-sm text-muted-foreground mt-1">Based on {stats.merchant.totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-safe" /> Satisfaction Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safe">{stats.merchant.satisfactionPercent}%</div>
            <p className="text-sm text-muted-foreground mt-1">{stats.merchant.happyTransactions} happy votes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Fraud Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.fraudReportCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Verified user reports</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Satisfaction Trend</CardTitle>
            <CardDescription>Percentage of happy transactions over the last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="satisfaction" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSatisfaction)" name="Satisfaction %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Total votes per week</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'hsl(var(--muted))'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Votes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest votes from users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentVotes.map(vote => (
                <div key={vote.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${vote.isHappy ? 'bg-safe' : 'bg-destructive'}`}></div>
                    <span className="font-medium text-sm">
                      {vote.isHappy ? 'Positive Transaction' : 'Negative Experience'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(vote.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {stats.recentVotes.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
