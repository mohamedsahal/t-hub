import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
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
  ArrowRight 
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
  const [activeTab, setActiveTab] = useState<string>("card");
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      paymentType: "one_time",
      paymentMethod: "card",
      phone: user?.phone || "",
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
  const formatPhoneNumber = (value: string) => {
    // If doesn't start with +, add +252 (Somalia code)
    if (!value.startsWith("+")) {
      return "+252" + value.replace(/[^0-9]/g, "");
    }
    return value;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Enrollment</CardTitle>
        <CardDescription>
          Course: {title} - {formatCurrency(price)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
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
              
              <Tabs defaultValue="card" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="mobile_wallet" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Wallet</span>
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
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EVCPlus">EVCPlus (Hormuud)</SelectItem>
                            <SelectItem value="ZAAD">ZAAD Service (Telesom)</SelectItem>
                            <SelectItem value="SAHAL">SAHAL Service (Golis)</SelectItem>
                            <SelectItem value="WAAFI">WAAFI</SelectItem>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
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
                          {watchPaymentMethod === "mobile_wallet" 
                            ? "For testing, use: +252611111111 (EVCPlus), +252631111111 (ZAAD), +252911111111 (SAHAL)"
                            : "Required for payment confirmation"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <AlertDescription>
                      You will receive a prompt on your mobile device to confirm the payment.
                      For test accounts, use PIN: 1212
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>

            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <AlertDescription className="text-sm">
                You'll be redirected to WaafiPay's secure payment gateway to complete your payment.
                After payment is processed, you'll automatically return to this site.
              </AlertDescription>
            </Alert>
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {`Pay ${watchPaymentType === "installment" && installmentPlan 
                    ? formatCurrency(installmentPlan.amounts[0]) + " now" 
                    : formatCurrency(price)}`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 text-sm text-gray-500">
        <div>Secure Payment</div>
        <div>Powered by WaafiPay</div>
      </CardFooter>
    </Card>
  );
};

export default PaymentForm;
