import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  CreditCard, 
  AlertCircle, 
  Smartphone, 
  ArrowRight,
  LockKeyhole
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import InstallmentOptions from "./InstallmentOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Payment method enum
enum PaymentMethod {
  CARD = 'card',
  MOBILE_WALLET = 'mobile_wallet',
}

// Wallet types
enum WalletType {
  WAAFI = 'WAAFI',
  ZAAD = 'ZAAD',
  EVCPLUS = 'EVCPlus',
  SAHAL = 'SAHAL',
}

// Base payment schema
const basePaymentSchema = z.object({
  paymentType: z.enum(["one_time", "installment"]),
  paymentMethod: z.enum(["card", "mobile_wallet"]),
});

// Card payment schema
const cardPaymentSchema = basePaymentSchema.extend({
  paymentMethod: z.literal("card"),
  cardNumber: z.string().min(16, "Card number must be at least 16 digits").max(19, "Card number must not exceed 19 digits"),
  cardName: z.string().min(2, "Cardholder name is required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  phone: z.string().min(9, "Phone number is required"),
});

// Mobile wallet payment schema
const mobileWalletSchema = basePaymentSchema.extend({
  paymentMethod: z.literal("mobile_wallet"),
  walletType: z.enum(["WAAFI", "ZAAD", "EVCPlus", "SAHAL"]),
  phone: z.string().min(9, "Phone number is required"),
});

// Combined schema that checks payment method and validates accordingly
const paymentSchema = z.discriminatedUnion("paymentMethod", [
  cardPaymentSchema,
  mobileWalletSchema,
]);

type PaymentFormProps = {
  courseId: number;
  price: number;
  title: string;
  onSuccess: (referenceId: string) => void;
};

const PaymentForm = ({ courseId, price, title, onSuccess }: PaymentFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [installmentPlan, setInstallmentPlan] = useState<{ months: number; amounts: number[] } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("mobile_wallet");
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      paymentType: "one_time",
      paymentMethod: "mobile_wallet",
      walletType: "EVCPlus",
      phone: user?.phone || "+25261",
    },
  });

  const watchPaymentType = form.watch("paymentType");
  const watchPaymentMethod = form.watch("paymentMethod");

  // When tab changes, update the payment method in the form
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue("paymentMethod", value as PaymentMethod);
  };

  const { mutate, isPending, isError, error, data } = useMutation({
    mutationFn: async (formData: z.infer<typeof paymentSchema>) => {
      const paymentData = {
        amount: price,
        courseId,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        walletType: formData.paymentMethod === PaymentMethod.MOBILE_WALLET ? formData.walletType : undefined,
        phone: formData.phone,
        installments: installmentPlan?.amounts.map((amount, index) => ({
          amount,
          dueDate: new Date(Date.now() + (index * 30 * 24 * 60 * 60 * 1000)), // 30 days apart
          isPaid: index === 0 // First installment is paid immediately
        })),
      };
      
      const response = await apiRequest("POST", "/api/payment/process", paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      // Call parent's onSuccess handler with reference ID
      if (data.referenceId) {
        onSuccess(data.referenceId);
      }
      
      if (data.redirectUrl) {
        // Redirect to WaafiPay Hosted Payment Page
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Payment Initiated",
          description: "Your payment is being processed. You will be redirected to complete the payment.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "There was an issue initiating your payment. Please try again.",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof paymentSchema>) => {
    // For installment payments, make sure an installment plan is selected
    if (data.paymentType === "installment" && !installmentPlan) {
      toast({
        variant: "destructive",
        title: "Installment Plan Required",
        description: "Please select an installment plan before proceeding.",
      });
      return;
    }
    
    // Process payment
    mutate(data);
  };

  // Format card number input with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date input MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Format phone number to ensure it starts with country code
  const formatPhoneNumber = (value: string, walletType?: string) => {
    // Clean the number first
    const cleaned = value.replace(/[^0-9+]/g, "");
    
    // If already has + sign, but not the correct prefix, replace it
    if (cleaned.startsWith("+") && walletType) {
      const prefix = getCountryCodePrefix(walletType);
      // Check if it has the wrong prefix
      if (!cleaned.startsWith(prefix)) {
        // Remove the + and any digits up to the country code length, then add the correct prefix
        return prefix + cleaned.substring(cleaned.indexOf('+') + 4); // +252 is 4 chars
      }
      return cleaned;
    }
    
    // If no + sign, add the appropriate prefix based on wallet type
    if (!cleaned.startsWith("+")) {
      const prefix = getCountryCodePrefix(walletType);
      return prefix + cleaned;
    }
    
    return cleaned;
  };
  
  // Get country code prefix based on wallet type
  const getCountryCodePrefix = (walletType?: string): string => {
    if (!walletType) return "+252"; // Default Somalia code
    
    switch (walletType) {
      case "EVCPlus": // Hormuud
        return "+25261";
      case "ZAAD": // Telesom
        return "+25263";
      case "SAHAL": // Golis
        return "+25290";
      default:
        return "+252";
    }
  };

  return (
    <Card className="w-full border-0 shadow-lg overflow-hidden">
      <div className="bg-primary text-white py-5 px-6">
        <h2 className="text-xl font-bold">Complete Your Enrollment</h2>
        <p className="text-sm opacity-90 mt-1">
          Course: {title} - <span className="font-semibold">{formatCurrency(price)}</span>
        </p>
      </div>
      
      <CardContent className="p-6 pt-8">
        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "There was an error processing your payment. Please try again."}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Options</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="one_time" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          One-time payment ({formatCurrency(price)})
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="installment" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Installment plan
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPaymentType === "installment" && (
              <InstallmentOptions 
                totalAmount={price} 
                onSelectPlan={setInstallmentPlan} 
              />
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium text-lg mb-4">Select Payment Method</h3>
              
              <Tabs defaultValue="mobile_wallet" value={activeTab} onValueChange={handleTabChange} className="mt-2">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30">
                  <TabsTrigger 
                    value="mobile_wallet" 
                    className={`flex items-center gap-2 rounded-md ${activeTab === 'mobile_wallet' ? 'bg-primary text-white' : 'hover:bg-muted/60'}`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Wallet</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="card" 
                    className={`flex items-center gap-2 rounded-md ${activeTab === 'card' ? 'bg-primary text-white' : 'hover:bg-muted/60'}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="pt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="4111 1111 1111 1111" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(formatCardNumber(e.target.value));
                            }}
                            maxLength={19}
                          />
                        </FormControl>
                        <FormDescription>
                          For testing, use: 4111 1111 1111 1111
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardholder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="MM/YY" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(formatExpiryDate(e.target.value));
                              }}
                              maxLength={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Example: 12/28
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123" 
                              {...field} 
                              type="password"
                              maxLength={3}
                            />
                          </FormControl>
                          <FormDescription>
                            For testing, use: 000
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+252xxxxxxxxx" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(formatPhoneNumber(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Required for payment confirmation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="mobile_wallet" className="pt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="walletType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Mobile Wallet</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Update phone number with correct prefix based on wallet
                            const currentPhone = form.getValues("phone") || "";
                            const newPhone = formatPhoneNumber(currentPhone, value);
                            form.setValue("phone", newPhone);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EVCPlus" className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-green-500"></div>
                              <span>EVCPlus (Hormuud)</span>
                            </SelectItem>
                            <SelectItem value="ZAAD" className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-blue-500"></div>
                              <span>ZAAD Service (Telesom)</span>
                            </SelectItem>
                            <SelectItem value="SAHAL" className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-orange-500"></div>
                              <span>SAHAL Service (Golis)</span>
                            </SelectItem>
                            <SelectItem value="WAAFI" className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-purple-500"></div>
                              <span>WAAFI</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred mobile wallet service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => {
                      const walletType = form.getValues("walletType");
                      const prefix = getCountryCodePrefix(walletType);
                      const placeholderExample = walletType === "EVCPlus" 
                        ? "+25261xxxxxxx" 
                        : walletType === "ZAAD" 
                          ? "+25263xxxxxxx" 
                          : walletType === "SAHAL" 
                            ? "+25290xxxxxxx" 
                            : "+252xxxxxxxx";
                      
                      return (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder={placeholderExample}
                                {...field} 
                                className="pl-20" // Extra padding for the prefix
                                onChange={(e) => {
                                  const formattedValue = formatPhoneNumber(e.target.value, walletType);
                                  field.onChange(formattedValue);
                                }}
                              />
                              <div className="absolute left-0 top-0 flex h-full items-center px-3 font-medium text-sm text-muted-foreground border-r">
                                {prefix}
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {watchPaymentMethod === "mobile_wallet" 
                              ? walletType === "EVCPlus" 
                                ? "For testing, use: +252611111111 (PIN: 1212)"
                                : walletType === "ZAAD"
                                  ? "For testing, use: +252631111111 (PIN: 1212)"
                                  : walletType === "SAHAL"
                                    ? "For testing, use: +252911111111 (PIN: 1212)"
                                    : "For testing, use mobile number with PIN: 1212"
                              : "Required for payment confirmation"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <Alert className="border-l-4 border-primary/60 bg-primary/5">
                    <AlertDescription className="flex items-start">
                      <Smartphone className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      <div>
                        You will receive a prompt on your mobile device to confirm the payment.
                        <span className="block mt-1 font-medium">For test accounts, use PIN: 1212</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>

            <Alert className="border-l-4 border-blue-500 bg-blue-50 text-blue-800">
              <AlertDescription className="flex items-start">
                <LockKeyhole className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                <div className="text-sm">
                  You'll be redirected to WaafiPay's secure payment gateway to complete your payment.
                  After payment is processed, you'll automatically return to this site.
                </div>
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              className="w-full h-12 mt-6 text-base font-semibold shadow-md bg-primary hover:bg-primary/90 transition-all" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {`Pay ${watchPaymentType === "installment" && installmentPlan 
                    ? formatCurrency(installmentPlan.amounts[0]) + " now" 
                    : formatCurrency(price)}`}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t p-4 px-6 text-sm bg-gray-50">
        <div className="flex items-center">
          <LockKeyhole className="h-4 w-4 mr-2 text-primary/70" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center font-medium text-primary/80">
          Powered by WaafiPay
        </div>
      </CardFooter>
    </Card>
  );
};

export default PaymentForm;
