import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Calendar, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Search,
  UserPlus,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { formatRelative, format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: number;
  title: string;
  type: string;
  category: string;
  shortName: string;
}

interface Cohort {
  id: number;
  name: string;
  description: string | null;
  courseId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  maxStudents: number | null;
  academicYear: string;
  createdAt: string;
}

// Form schema for creating/updating cohorts
const cohortFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional().or(z.literal("")),
  courseId: z.number({
    required_error: "Please select a course",
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["active", "completed", "upcoming"], {
    required_error: "Please select a status",
  }),
  maxStudents: z.number().optional().or(z.literal("")).transform(val => val === "" ? undefined : Number(val)),
  academicYear: z.string().min(4, "Academic year must be at least 4 characters"),
});

type CohortFormValues = z.infer<typeof cohortFormSchema>;

// Component to display status badge
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
    case 'upcoming':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Upcoming</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const CohortManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [isAddingCohort, setIsAddingCohort] = useState(false);
  const [isEditingCohort, setIsEditingCohort] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const queryClient = useQueryClient();

  // Fetch cohorts
  const { data: cohorts = [], isLoading: isLoadingCohorts } = useQuery<Cohort[]>({
    queryKey: ["/api/admin/cohorts"],
  });

  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  // Create cohort mutation
  const createCohortMutation = useMutation({
    mutationFn: async (data: CohortFormValues) => {
      // Ensure data is properly formatted, especially the name field
      const formattedData = {
        ...data,
        name: data.name?.trim() || "", // Make sure name is not undefined and is trimmed
        courseId: Number(data.courseId), // Ensure courseId is a number
        maxStudents: data.maxStudents ? Number(data.maxStudents) : null,
      };
      
      console.log("Submitting cohort data:", formattedData);
      return await apiRequest("/api/admin/cohorts", { method: "POST", data: formattedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({
        title: "Success",
        description: "Cohort created successfully",
        variant: "default",
      });
      setIsAddingCohort(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Cohort creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create cohort",
        variant: "destructive",
      });
    },
  });

  // Update cohort mutation
  const updateCohortMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CohortFormValues }) => {
      // Apply the same data formatting as in create mutation
      const formattedData = {
        ...data,
        name: data.name?.trim() || "", // Make sure name is not undefined and is trimmed
        courseId: Number(data.courseId), // Ensure courseId is a number
        maxStudents: data.maxStudents ? Number(data.maxStudents) : null,
      };
      
      console.log("Updating cohort data:", formattedData);
      return await apiRequest(`/api/admin/cohorts/${id}`, { method: "PATCH", data: formattedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({
        title: "Success",
        description: "Cohort updated successfully",
        variant: "default",
      });
      setIsEditingCohort(false);
      setSelectedCohort(null);
    },
    onError: (error: any) => {
      console.error("Cohort update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update cohort",
        variant: "destructive",
      });
    },
  });

  // Delete cohort mutation
  const deleteCohortMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/cohorts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cohorts"] });
      toast({
        title: "Success",
        description: "Cohort deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCohort(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cohort",
        variant: "destructive",
      });
    },
  });

  // Form for creating/editing cohorts
  const form = useForm<CohortFormValues>({
    resolver: zodResolver(cohortFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "upcoming",
      academicYear: new Date().getFullYear().toString(),
      maxStudents: undefined,
    },
  });

  // Filter cohorts based on search, course, and status
  const filteredCohorts = (cohorts as Cohort[])
    .filter((cohort) => {
      return (
        (searchQuery === "" ||
          cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cohort.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (courseFilter === "all" || cohort.courseId === parseInt(courseFilter)) &&
        (statusFilter === "all" || cohort.status === statusFilter) &&
        (activeTab === "all" || cohort.status === activeTab)
      );
    })
    .sort((a: Cohort, b: Cohort) => {
      // Sort by start date, most recent first
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  // Setup form for editing
  const setupEditForm = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    form.reset({
      name: cohort.name,
      description: cohort.description || undefined,
      courseId: cohort.courseId,
      startDate: new Date(cohort.startDate).toISOString().split('T')[0],
      endDate: new Date(cohort.endDate).toISOString().split('T')[0],
      status: cohort.status,
      maxStudents: cohort.maxStudents || undefined,
      academicYear: cohort.academicYear,
    });
    setIsEditingCohort(true);
  };

  // Handle delete cohort
  const handleDeleteCohort = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setIsDeleteDialogOpen(true);
  };

  // Handle view cohort details
  const viewCohortDetails = (cohortId: number) => {
    // Navigate to cohort details page
    window.location.href = `/admin/cohorts/${cohortId}`;
  };

  // Handle manage enrollments
  const manageEnrollments = (cohortId: number) => {
    // Navigate to cohort enrollments management page
    window.location.href = `/admin/cohorts/${cohortId}/enrollments`;
  };

  // Reset form when opening add dialog
  const handleAddCohort = () => {
    // Make sure all required fields have default values
    form.reset({
      name: "",
      description: "",
      courseId: (courses && courses.length > 0) ? courses[0].id : undefined, // Set default course to first course
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      status: "upcoming",
      maxStudents: undefined,
      academicYear: new Date().getFullYear().toString(),
    });
    setIsAddingCohort(true);
  };

  // Submit handler for the form
  const onSubmit = (data: CohortFormValues) => {
    if (isEditingCohort && selectedCohort) {
      updateCohortMutation.mutate({ id: selectedCohort.id, data });
    } else {
      createCohortMutation.mutate(data);
    }
  };

  // Get course name by ID
  const getCourseName = (courseId: number) => {
    const course = (courses as Course[]).find((c) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Calculate enrollment progress
  const calculateEnrollmentProgress = (current: number, max?: number | null) => {
    if (!max) return 0;
    return (current / max) * 100;
  };

  // Get enrollment count for a cohort
  const getEnrollmentCount = (cohortId: number) => {
    // This should be replaced with actual enrollment count data
    return Math.floor(Math.random() * 30); // Placeholder
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cohort Management</h2>
          <p className="text-muted-foreground">
            Manage class groups and student batches
          </p>
        </div>
        <Button onClick={handleAddCohort}>
          <Plus className="mr-2 h-4 w-4" />
          New Cohort
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cohorts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {(courses as Course[]).map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="pt-4">
          {isLoadingCohorts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCohorts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No cohorts found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || courseFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first cohort to get started"}
                </p>
                {!searchQuery && courseFilter === "all" && statusFilter === "all" && (
                  <Button onClick={handleAddCohort} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    New Cohort
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCohorts.map((cohort: Cohort) => {
                const enrollmentCount = getEnrollmentCount(cohort.id);
                const progressPercentage = calculateEnrollmentProgress(
                  enrollmentCount,
                  cohort.maxStudents
                );
                
                return (
                  <Card key={cohort.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{cohort.name}</CardTitle>
                        <StatusBadge status={cohort.status} />
                      </div>
                      <CardDescription className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {getCourseName(cohort.courseId)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Start Date</span>
                            <span className="font-medium flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
                              {format(new Date(cohort.startDate), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">End Date</span>
                            <span className="font-medium flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
                              {format(new Date(cohort.endDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        
                        {cohort.description && (
                          <p className="text-muted-foreground line-clamp-2">{cohort.description}</p>
                        )}
                        
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Enrollment</span>
                            <span className="font-medium">
                              {enrollmentCount} {cohort.maxStudents && `/ ${cohort.maxStudents}`}
                            </span>
                          </div>
                          <Progress value={progressPercentage} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setupEditForm(cohort)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteCohort(cohort)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => manageEnrollments(cohort.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Enrollments
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => viewCohortDetails(cohort.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Cohort Dialog */}
      <Dialog
        open={isAddingCohort || isEditingCohort}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingCohort(false);
            setIsEditingCohort(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingCohort ? "Edit Cohort" : "Create New Cohort"}
            </DialogTitle>
            <DialogDescription>
              {isEditingCohort
                ? "Update cohort details and schedule"
                : "Add a new cohort for a course"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cohort Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Batch 2025" {...field} />
                      </FormControl>
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
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(courses as Course[]).map((course) => (
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
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description of the cohort"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upcoming">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                              Upcoming
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center">
                              <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                              Completed
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Students</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optional"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for unlimited
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2025-2026" {...field} />
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
                    setIsAddingCohort(false);
                    setIsEditingCohort(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCohortMutation.isPending || updateCohortMutation.isPending
                  }
                >
                  {(createCohortMutation.isPending || updateCohortMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditingCohort ? "Update Cohort" : "Create Cohort"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the cohort "{selectedCohort?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCohort) {
                  deleteCohortMutation.mutate(selectedCohort.id);
                }
              }}
              disabled={deleteCohortMutation.isPending}
            >
              {deleteCohortMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CohortManagement;