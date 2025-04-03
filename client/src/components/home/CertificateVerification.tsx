import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const certificateSchema = z.object({
  certificateId: z
    .string()
    .min(5, "Certificate ID is required")
    .regex(
      /^THM-\d{4}-\d{5}$/,
      "Invalid certificate format (e.g., THB-2023-12345)",
    ),
});

const CertificateVerification = () => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const form = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      certificateId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof certificateSchema>) => {
    try {
      setIsVerifying(true);
      setVerificationResult(null);

      const response = await fetch(
        `/api/certificates/verify/${values.certificateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setVerificationResult(data);
        if (data.verified) {
          toast({
            title: "Certificate Verified",
            description: "The certificate is valid and authentic.",
            variant: "default",
          });
        } else {
          toast({
            title: "Certificate Not Found",
            description:
              "We couldn't verify this certificate. Please check the ID and try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Verification Failed",
          description:
            data.message || "Failed to verify certificate. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description:
          "An error occurred during verification. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="py-16 bg-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold font-inter">
            Verify Your Certificate
          </h2>
          <p className="mt-4 text-lg">
            Enter your certificate ID to verify its authenticity
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="certificateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Certificate ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your certificate ID (e.g., THB-2023-12345)"
                            {...field}
                            className="shadow-sm focus:ring-primary focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full py-3"
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Certificate"
                    )}
                  </Button>
                </form>
              </Form>

              {verificationResult && verificationResult.verified && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-medium text-green-800">
                    Certificate Verified ✓
                  </h3>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Student:</strong>{" "}
                      {verificationResult.certificate.studentName}
                    </p>
                    <p>
                      <strong>Course:</strong>{" "}
                      {verificationResult.certificate.courseName}
                    </p>
                    <p>
                      <strong>Issue Date:</strong>{" "}
                      {new Date(
                        verificationResult.certificate.issueDate,
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Certificate ID:</strong>{" "}
                      {verificationResult.certificate.id}
                    </p>
                  </div>
                </div>
              )}

              {verificationResult && !verificationResult.verified && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-medium text-red-800">
                    Certificate Not Found ✗
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We couldn't verify this certificate. Please check the ID and
                    try again.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CertificateVerification;
