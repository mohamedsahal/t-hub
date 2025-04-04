import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Search, Trash2, Edit, Award, XCircle, Filter, RefreshCw } from "lucide-react";
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

const CertificatesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
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
      return apiRequest('/api/certificates', 'POST', certificateData);
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
      return apiRequest(`/api/certificates/${id}`, 'PATCH', data);
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
      return apiRequest(`/api/certificates/${id}`, 'DELETE');
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

  // Filter certificates based on search
  const filteredCertificates = certificates.filter((certificate: Certificate) => {
    if (!searchQuery) return true;
    
    const user = users.find((u: User) => u.id === certificate.userId);
    const course = courses.find((c: Course) => c.id === certificate.courseId);
    
    const searchLower = searchQuery.toLowerCase();
    return (
      certificate.certificateId.toLowerCase().includes(searchLower) ||
      (user && user.name.toLowerCase().includes(searchLower)) ||
      (course && course.title.toLowerCase().includes(searchLower))
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
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          disabled={isLoadingUsers}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
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
                  placeholder="Search certificates..."
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
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      disabled={isLoadingUsers}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
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
    </DashboardLayout>
  );
};

export default CertificatesManagement;