import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateMerchant } from "@workspace/api-client-react";
import { Store, ShieldPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  upiId: z.string().email({ message: "Invalid UPI ID format (use email format for demo e.g. store@upi)" }),
  category: z.string().min(1, { message: "Please select a category." }),
});

export default function AddMerchant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMerchantMutation = useCreateMerchant();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      upiId: "",
      category: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMerchantMutation.mutate({
      data: {
        name: values.name,
        upiId: values.upiId.toLowerCase(),
        category: values.category,
      }
    }, {
      onSuccess: (data) => {
        toast({
          title: "Merchant Registered",
          description: `${data.name} has been added to the trust registry.`,
        });
        setLocation(`/merchants/${encodeURIComponent(data.upiId)}`);
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err?.error || "Could not register merchant.",
          variant: "destructive"
        });
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-border shadow-lg">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <Store className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Register Merchant</CardTitle>
          <CardDescription className="text-base">
            Add a new UPI merchant to the TrustScore network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Rahul's Coffee Shop" {...field} className="h-12 bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. rahul@upi" {...field} className="h-12 bg-card font-mono" />
                    </FormControl>
                    <FormDescription>
                      The official UPI ID used for payments. Must be unique.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-card">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Retail & Grocery">Retail & Grocery</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Online Store">Online Store</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg mt-8" 
                disabled={createMerchantMutation.isPending}
              >
                {createMerchantMutation.isPending ? (
                  "Registering..."
                ) : (
                  <>
                    <ShieldPlus className="mr-2 h-5 w-5" /> Add to Trust Network
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
