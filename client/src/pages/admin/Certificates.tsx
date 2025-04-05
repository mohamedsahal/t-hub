import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit, 
  Award, 
  XCircle, 
  Filter, 
  RefreshCw, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Copy, 
  Check,
  Share2
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { insertCertificateSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

// Extend the schema for form validation
const certificateFormSchema = insertCertificateSchema.extend({
  userId: z.coerce.number().min(1, "User is required"),
  courseId: z.coerce.number().min(1, "Course is required"),
  certificateId: z.string().min(1, "Certificate ID is required"),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

type CertificateFormValues = z.infer<typeof certificateFormSchema>;

// Define ShareData interface
interface ShareData {
  verificationUrl: string;
  shareTitle: string;
  shareDescription: string;
  studentName: string;
  courseName: string;
}

const CertificatesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isLoadingShareData, setIsLoadingShareData] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // State for student search
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  // Form handling for add/edit
  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      userId: 0,
      courseId: 0,
      certificateId: "",
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
    },
  });

  // Define types for the API responses
  interface Certificate {
    id: number;
    userId: number;
    courseId: number;
    certificateId: string;
    issueDate: string;
    expiryDate: string | null;
  }

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
    type: string;
  }

  // Query for certificates
  const {
    data: certificates = [] as Certificate[],
    isLoading: isLoadingCertificates,
    isError: isErrorCertificates,
    refetch: refetchCertificates,
  } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    retry: 1,
  });
  
  // Query for users (for dropdown)
  const {
    data: users = [] as User[],
    isLoading: isLoadingUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: 1,
  });
  
  // Query for courses (for dropdown)
  const {
    data: courses = [] as Course[],
    isLoading: isLoadingCourses,
  } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    retry: 1,
  });

  // Mutation for creating a certificate
  const createCertificateMutation = useMutation({
    mutationFn: (certificateData: any) => {
      return apiRequest('POST', '/api/certificates', certificateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificate created",
        description: "The certificate has been created successfully.",
        variant: "default",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a certificate
  const updateCertificateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/certificates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificate updated",
        description: "The certificate has been updated successfully.",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      setSelectedCertificate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a certificate
  const deleteCertificateMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificate deleted",
        description: "The certificate has been deleted successfully.",
        variant: "default",
      });
      setDeleteConfirmOpen(false);
      setSelectedCertificate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding a certificate
  const onSubmitAdd = (data: CertificateFormValues) => {
    createCertificateMutation.mutate(data);
  };

  // Handle form submission for editing a certificate
  const onSubmitEdit = (data: CertificateFormValues) => {
    if (selectedCertificate) {
      updateCertificateMutation.mutate({
        id: selectedCertificate.id,
        data,
      });
    }
  };

  // Handle certificate deletion
  const handleDelete = () => {
    if (selectedCertificate) {
      deleteCertificateMutation.mutate(selectedCertificate.id);
    }
  };

  // Open edit dialog and populate form
  const handleEdit = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    
    // Format dates for the form
    const formattedIssueDate = certificate.issueDate 
      ? new Date(certificate.issueDate).toISOString().split('T')[0]
      : "";
    
    const formattedExpiryDate = certificate.expiryDate
      ? new Date(certificate.expiryDate).toISOString().split('T')[0]
      : "";
    
    form.reset({
      userId: certificate.userId,
      courseId: certificate.courseId,
      certificateId: certificate.certificateId,
      issueDate: formattedIssueDate,
      expiryDate: formattedExpiryDate,
    });
    
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setDeleteConfirmOpen(true);
  };

  // Add interface for cohort enrollments
  interface CohortEnrollment {
    id: number;
    cohortId: number;
    userId: number;
    studentId: string;
    status: string;
    enrollmentDate: string;
  }
  
  // Query for cohort enrollments to search by student ID
  const {
    data: cohortEnrollments = [] as CohortEnrollment[],
    isLoading: isLoadingCohortEnrollments,
  } = useQuery<CohortEnrollment[]>({
    queryKey: ["/api/cohort-enrollments"],
    retry: 1,
  });
  
  // Filter certificates based on search
  const filteredCertificates = certificates.filter((certificate: Certificate) => {
    if (!searchQuery) return true;
    
    const user = users.find((u: User) => u.id === certificate.userId);
    const course = courses.find((c: Course) => c.id === certificate.courseId);
    
    // Find any enrollment with this user ID that has a matching student ID
    const userEnrollments = cohortEnrollments.filter(
      (enrollment) => enrollment.userId === certificate.userId
    );
    
    const hasMatchingStudentId = userEnrollments.some(
      (enrollment) => enrollment.studentId && 
      enrollment.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const searchLower = searchQuery.toLowerCase();
    return (
      certificate.certificateId.toLowerCase().includes(searchLower) ||
      (user && user.name.toLowerCase().includes(searchLower)) ||
      (course && course.title.toLowerCase().includes(searchLower)) ||
      hasMatchingStudentId
    );
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Find user name by ID
  const getUserName = (userId: number) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? user.name : "Unknown user";
  };

  // Find course title by ID
  const getCourseName = (courseId: number) => {
    const course = courses.find((c: Course) => c.id === courseId);
    return course ? course.title : "Unknown course";
  };
  
  // Handle the share certificate function
  const handleShareCertificate = async (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsLoadingShareData(true);
    setLinkCopied(false);
    
    try {
      // Fetch the share data from the API
      const response = await fetch(`/api/certificates/share/${certificate.certificateId}`);
      const data = await response.json();
      
      if (data.success) {
        setShareData({
          verificationUrl: data.certificate.verificationUrl,
          shareTitle: data.certificate.shareTitle,
          shareDescription: data.certificate.shareDescription,
          studentName: data.certificate.studentName,
          courseName: data.certificate.courseName
        });
        setIsShareDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to retrieve sharing information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retrieve sharing information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShareData(false);
    }
  };
  
  // Handle copy to clipboard
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast({
      title: "Link copied",
      description: "Certificate verification link copied to clipboard",
    });
    
    // Reset the copied state after 3 seconds
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
            <p className="text-gray-600">Manage and issue certificates to students</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Add Certificate</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Certificate</DialogTitle>
                <DialogDescription>
                  Fill in the details to issue a new certificate to a student.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>Student</FormLabel>
                        
                        {/* Search box */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Search student by name or ID..."
                              className="pl-8"
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              disabled={isLoadingUsers}
                            />
                          </div>
                          
                          {/* Display student results */}
                          {studentSearchQuery && (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                              {users
                                .filter(user => 
                                  user.role === "student" &&
                                  (user.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                   user.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                )
                                .map(user => (
                                  <div 
                                    key={user.id}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                                      selectedStudent?.id === user.id ? 'bg-gray-100 font-medium' : ''
                                    }`}
                                    onClick={() => {
                                      setSelectedStudent(user);
                                      field.onChange(user.id);
                                      setStudentSearchQuery('');
                                    }}
                                  >
                                    <div>{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                ))
                              }
                              {users.filter(user => 
                                user.role === "student" &&
                                (user.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                 user.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No students found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Show selected student */}
                        {selectedStudent && field.value > 0 && (
                          <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                            <div>
                              <div className="font-medium">{selectedStudent.name}</div>
                              <div className="text-xs text-gray-500">{selectedStudent.email}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedStudent(null);
                                field.onChange(0);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Clear selection</span>
                            </Button>
                          </div>
                        )}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select
                          disabled={isLoadingCourses}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="certificateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., THB-2025-12345" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique identifier for this certificate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCertificateMutation.isPending}>
                      {createCertificateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Certificate"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Certificates</CardTitle>
            <CardDescription>
              View and manage all certificates issued to students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name, ID, or student ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchCertificates()}
                className="text-xs h-9 px-2.5"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
            </div>

            {isLoadingCertificates ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-500">Loading certificates...</span>
              </div>
            ) : isErrorCertificates ? (
              <div className="bg-red-50 p-4 rounded-md flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading certificates
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    There was an error loading the certificates. Please try again or contact support.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchCertificates()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <Award className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No certificates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? "No certificates match your search criteria"
                    : "Start by adding certificates to students who completed courses"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((certificate: Certificate) => (
                      <TableRow key={certificate.id}>
                        <TableCell className="font-medium">
                          {certificate.certificateId}
                        </TableCell>
                        <TableCell>{getUserName(certificate.userId)}</TableCell>
                        <TableCell>{getCourseName(certificate.courseId)}</TableCell>
                        <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                        <TableCell>
                          {certificate.expiryDate ? formatDate(certificate.expiryDate) : "No expiration"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(certificate)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShareCertificate(certificate)}
                              className="text-blue-500"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                              <span className="sr-only">Share</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(certificate)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Certificate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Certificate</DialogTitle>
            <DialogDescription>
              Update the certificate details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>Student</FormLabel>
                    
                    {/* Search box */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search student by name or ID..."
                          className="pl-8"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          disabled={isLoadingUsers}
                        />
                      </div>
                      
                      {/* Display student results */}
                      {studentSearchQuery && (
                        <div className="border rounded-md max-h-40 overflow-y-auto">
                          {users
                            .filter(user => 
                              user.role === "student" &&
                              (user.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                               user.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                            )
                            .map(user => (
                              <div 
                                key={user.id}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                                  selectedStudent?.id === user.id ? 'bg-gray-100 font-medium' : ''
                                }`}
                                onClick={() => {
                                  setSelectedStudent(user);
                                  field.onChange(user.id);
                                  setStudentSearchQuery('');
                                }}
                              >
                                <div>{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            ))
                          }
                          {users.filter(user => 
                            user.role === "student" &&
                            (user.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                             user.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No students found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Show selected student */}
                    {field.value > 0 && (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                        <div>
                          <div className="font-medium">{getUserName(field.value)}</div>
                          <div className="text-xs text-gray-500">
                            {users.find(u => u.id === field.value)?.email || ''}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-6 w-6 p-0"
                          onClick={() => {
                            setSelectedStudent(null);
                            field.onChange(0);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Clear selection</span>
                        </Button>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      disabled={isLoadingCourses}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course: Course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certificateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedCertificate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCertificateMutation.isPending}>
                  {updateCertificateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Certificate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the certificate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCertificate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCertificateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Share Certificate Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-primary" />
              Share Certificate
            </DialogTitle>
            <DialogDescription>
              {shareData ? (
                <>Share {shareData.studentName}'s certificate for {shareData.courseName}</>
              ) : (
                <>Share this certificate with others</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingShareData ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Loading share information...</p>
            </div>
          ) : shareData ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Certificate URL:</strong>
                </p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={shareData.verificationUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(shareData.verificationUrl)}
                    className="shrink-0"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Share to social media</h3>
                <Tabs defaultValue="linkedin" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </TabsTrigger>
                    <TabsTrigger value="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                    </TabsTrigger>
                    <TabsTrigger value="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      <span>Facebook</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="linkedin" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Share this certificate on LinkedIn to showcase your skills and achievements.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.verificationUrl)}&title=${encodeURIComponent(shareData.shareTitle)}&summary=${encodeURIComponent(shareData.shareDescription)}`,
                        "_blank"
                      )}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      Share on LinkedIn
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="twitter" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Tweet about your achievement and share your certificate with your followers.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.shareDescription)}&url=${encodeURIComponent(shareData.verificationUrl)}`,
                        "_blank"
                      )}
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Share on Twitter
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="facebook" className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Share this achievement with friends and family on Facebook.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.verificationUrl)}&quote=${encodeURIComponent(shareData.shareDescription)}`,
                        "_blank"
                      )}
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Share on Facebook
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              Unable to load sharing information
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CertificatesManagement;