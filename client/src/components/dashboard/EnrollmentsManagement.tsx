import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  Users,
  BookOpen,
  Calendar,
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  CheckCircle2,
  Clock4,
  Ban,
  Info
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define enrollment form schema
const enrollmentFormSchema = z.object({
  userId: z.coerce.number({
    required_error: "User is required",
    invalid_type_error: "User ID must be a number"
  }),
  courseId: z.coerce.number({
    required_error: "Course is required",
    invalid_type_error: "Course ID must be a number"
  }),
  status: z.enum(["active", "completed", "dropped"]),
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

export default function EnrollmentsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all enrollments
  const {
    data: enrollments,
    isLoading: isEnrollmentsLoading,
    isError: isEnrollmentsError,
  } = useQuery({
    queryKey: ['/api/enrollments'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/enrollments');
        return response;
      } catch (error) {
        console.error("Failed to fetch enrollments:", error);
        throw error;
      }
    },
  });

  // Fetch all users for the dropdown
  const {
    data: users,
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/users');
        return response;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
      }
    },
  });

  // Fetch all courses for the dropdown
  const {
    data: courses,
    isLoading: isCoursesLoading,
  } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/courses');
        return response;
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
      }
    },
  });

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (newEnrollment: EnrollmentFormValues) => {
      const response = await apiRequest('POST', '/api/enrollments', newEnrollment);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Enrollment Created",
        description: "The enrollment has been created successfully.",
        variant: "default",
      });
      addForm.reset();
    },
    onError: (error) => {
      console.error("Error creating enrollment:", error);
      toast({
        title: "Error",
        description: "Failed to create enrollment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update enrollment mutation
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EnrollmentFormValues }) => {
      const response = await apiRequest('PATCH', `/api/enrollments/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Enrollment Updated",
        description: "The enrollment has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating enrollment:", error);
      toast({
        title: "Error",
        description: "Failed to update enrollment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/enrollments/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Enrollment Deleted",
        description: "The enrollment has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting enrollment:", error);
      toast({
        title: "Error",
        description: "Failed to delete enrollment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form for adding new enrollment
  const addForm = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      userId: undefined,
      courseId: undefined,
      status: "active",
    },
  });

  // Form for editing enrollment
  const editForm = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      userId: undefined,
      courseId: undefined,
      status: "active",
    },
  });

  const onAddSubmit = (data: EnrollmentFormValues) => {
    createEnrollmentMutation.mutate(data);
  };

  const onEditSubmit = (data: EnrollmentFormValues) => {
    if (selectedEnrollment) {
      updateEnrollmentMutation.mutate({ id: selectedEnrollment.id, data });
    }
  };

  const handleEditClick = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    editForm.reset({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      status: enrollment.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEnrollment) {
      deleteEnrollmentMutation.mutate(selectedEnrollment.id);
    }
  };

  // Filter enrollments based on search query and active tab
  const filteredEnrollments = enrollments?.filter((enrollment: any) => {
    const user = users?.find((u: any) => u.id === enrollment.userId);
    const course = courses?.find((c: any) => c.id === enrollment.courseId);
    
    const userName = user?.name?.toLowerCase() || "";
    const userEmail = user?.email?.toLowerCase() || "";
    const courseTitle = course?.title?.toLowerCase() || "";
    
    const matchesSearch = 
      userName.includes(searchQuery.toLowerCase()) || 
      userEmail.includes(searchQuery.toLowerCase()) || 
      courseTitle.includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && enrollment.status === activeTab;
  });

  const getEnrollmentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: string; icon: React.ReactNode } } = {
      active: { 
        label: "Active", 
        variant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", 
        icon: <CheckCircle2 className="mr-1 h-3 w-3" /> 
      },
      completed: { 
        label: "Completed", 
        variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", 
        icon: <Check className="mr-1 h-3 w-3" /> 
      },
      dropped: { 
        label: "Dropped", 
        variant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", 
        icon: <Ban className="mr-1 h-3 w-3" /> 
      },
    };

    const statusInfo = statusMap[status] || { 
      label: status, 
      variant: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", 
      icon: <Info className="mr-1 h-3 w-3" /> 
    };

    return (
      <Badge variant="outline" className={`${statusInfo.variant} border-0 flex items-center`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  if (isEnrollmentsError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load enrollments</h3>
          <p className="text-sm text-muted-foreground">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enrollments..."
            className="pl-8 w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Enrollment
        </Button>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">All Enrollments</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="dropped">Dropped</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isEnrollmentsLoading || isUsersLoading || isCoursesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments && filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map((enrollment: any) => {
                      const user = users?.find((u: any) => u.id === enrollment.userId);
                      const course = courses?.find((c: any) => c.id === enrollment.courseId);
                      
                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{user?.name || "Unknown"}</span>
                              {user?.email && (
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{course?.title || "Unknown Course"}</TableCell>
                          <TableCell>
                            {getEnrollmentStatusBadge(enrollment.status)}
                          </TableCell>
                          <TableCell>
                            {enrollment.enrollmentDate ? format(new Date(enrollment.enrollmentDate), 'MMM dd, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell>
                            {enrollment.completionDate ? format(new Date(enrollment.completionDate), 'MMM dd, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(enrollment)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteClick(enrollment)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        {searchQuery ? "No matching enrollments found" : "No enrollments found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Enrollment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Enrollment</DialogTitle>
            <DialogDescription>
              Enroll a student in a course. Select a student, course, and enrollment status.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <FormField
                control={addForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isUsersLoading ? (
                          <div className="p-2">Loading students...</div>
                        ) : (
                          users
                            ?.filter((user: any) => user.role === "student")
                            .map((user: any) => (
                              <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                              >
                                {user.name} ({user.email})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCoursesLoading ? (
                          <div className="p-2">Loading courses...</div>
                        ) : (
                          courses
                            ?.filter((course: any) => course.status === "published")
                            .map((course: any) => (
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
                                {course.title}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of this enrollment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEnrollmentMutation.isPending}
                >
                  {createEnrollmentMutation.isPending ? "Creating..." : "Create Enrollment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Enrollment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Enrollment</DialogTitle>
            <DialogDescription>
              Update the enrollment details for this student.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isUsersLoading ? (
                          <div className="p-2">Loading students...</div>
                        ) : (
                          users
                            ?.filter((user: any) => user.role === "student")
                            .map((user: any) => (
                              <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                              >
                                {user.name} ({user.email})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCoursesLoading ? (
                          <div className="p-2">Loading courses...</div>
                        ) : (
                          courses?.map((course: any) => (
                            <SelectItem
                              key={course.id}
                              value={course.id.toString()}
                            >
                              {course.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of this enrollment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateEnrollmentMutation.isPending}
                >
                  {updateEnrollmentMutation.isPending ? "Updating..." : "Update Enrollment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Enrollment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Enrollment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this enrollment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {users?.find((u: any) => u.id === selectedEnrollment.userId)?.name || "Unknown Student"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {courses?.find((c: any) => c.id === selectedEnrollment.courseId)?.title || "Unknown Course"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Enrolled on {selectedEnrollment.enrollmentDate ? format(new Date(selectedEnrollment.enrollmentDate), 'MMM dd, yyyy') : "Unknown date"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span>Warning: This will remove the student from this course and delete any associated progress.</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteEnrollmentMutation.isPending}
            >
              {deleteEnrollmentMutation.isPending ? "Deleting..." : "Delete Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}