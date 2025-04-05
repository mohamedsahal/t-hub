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
                  
                  <div className="mt-6 pt-4 border-t border-green-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Share this certificate:</h4>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(`Verified Certificate: ${verificationResult.certificate.courseName}`)}`)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>LinkedIn</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I earned a certificate in ${verificationResult.certificate.courseName} from Thub Innovation!`)}&url=${encodeURIComponent(window.location.href)}`)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        <span>Twitter</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Certificate verification link copied to clipboard!");
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Link</span>
                      </Button>
                    </div>
                  </div>
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
