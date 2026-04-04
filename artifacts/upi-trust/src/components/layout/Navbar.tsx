import { Link } from "wouter";
import { ShieldCheck, LayoutDashboard, Users, PlusCircle } from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export default function Navbar() {
  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    }
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">UPI TrustScore</span>
          {health?.status === 'ok' && (
            <span className="flex h-2 w-2 rounded-full bg-safe ml-2" title="System Operational" />
          )}
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Link 
            href="/" 
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          <Link 
            href="/merchants" 
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Merchants</span>
          </Link>
          <Link 
            href="/add-merchant" 
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 px-3 text-sm font-medium transition-colors"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Add Merchant</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
