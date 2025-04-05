import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Loader2, Award, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const certificateSchema = z.object({
  certificateId: z.string().min(1, "Certificate ID is required")
});

const VerifyCertificate = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const form = useForm<z.infer<typeof certificateSchema>>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      certificateId: ""
    }
  });

  const onSubmit = async (values: z.infer<typeof certificateSchema>) => {
    try {
      setIsVerifying(true);
      setVerificationResult(null);
      
      const response = await fetch(`/api/certificates/verify/${values.certificateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({
        verified: false,
        message: "Error connecting to verification service"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
        <p className="mt-3 text-lg text-gray-600">
          Verify the authenticity of certificates issued by Thub Innovation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Verify a Certificate</CardTitle>
            <CardDescription>
              Enter the certificate ID to verify its authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="certificateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your certificate ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isVerifying} className="w-full">
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

            <div className="mt-6 text-sm text-gray-500">
              <p>
                You can find the certificate ID on the bottom of your certificate.
                If you're having trouble locating it, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Result</CardTitle>
            <CardDescription>
              The authenticity status of the certificate will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-gray-600">Verifying certificate...</p>
              </div>
            ) : verificationResult ? (
              verificationResult.verified ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-medium text-green-800">Certificate is Valid</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificate ID:</span>
                      <span className="font-medium">{verificationResult.certificate.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student Name:</span>
                      <span className="font-medium">{verificationResult.certificate.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course:</span>
                      <span className="font-medium">{verificationResult.certificate.courseName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">{formatDate(verificationResult.certificate.issueDate)}</span>
                    </div>
                  </div>
                  
                  {/* Share certificate functionality removed from public landing page */}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center mb-4">
                    <XCircle className="h-8 w-8 text-red-600 mr-3" />
                    <h3 className="text-lg font-medium text-red-800">Certificate Not Found</h3>
                  </div>
                  <p className="text-gray-600">
                    The certificate ID you provided could not be verified. Please check the ID and try again, or contact our support team for assistance.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Award className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Enter a certificate ID on the left to verify its authenticity
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">About Our Certificates</h2>
        <p className="text-gray-600 mb-4">
          All certificates issued by Thub Innovation are digitally secured and verifiable through our online system. 
          Each certificate contains a unique ID that can be used to confirm its authenticity.
        </p>
        <p className="text-gray-600">
          Our certificates are recognized by industry partners and affiliated universities including Bosaso University, 
          East Africa University, and Frontier University. They can be used to demonstrate your skills and 
          qualifications to potential employers or for further educational pursuits.
        </p>
      </div>
    </div>
  );
};

export default VerifyCertificate;
