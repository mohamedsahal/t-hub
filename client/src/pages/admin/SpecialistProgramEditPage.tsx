import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define validation schema for the form
const editProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  code: z.string().min(1, "Program code is required").max(10, "Code should be no more than 10 characters"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 week"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  hasDiscounted: z.boolean().default(false),
  discountedPrice: z.coerce.number().optional(),
  discountExpiryDate: z.string().optional(),
});

type FormValues = z.infer<typeof editProgramSchema>;

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  category: string;
  imageUrl: string | null;
  duration: number;
}

interface ProgramCourse {
  id: number;
  programId: number;
  courseId: number;
  order: number;
  isRequired: boolean;
  course?: Course;
}

interface SpecialistProgram {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string | null;
  isActive: boolean;
  isVisible: boolean;
  hasDiscounted: boolean;
  discountedPrice: number | null;
  discountExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SpecialistProgramEditPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/courses/specialist/edit/:id");
  const programId = match ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourses, setSelectedCourses] = useState<ProgramCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(editProgramSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      duration: 8,
      imageUrl: "",
      isActive: true,
      isVisible: true,
      hasDiscounted: false,
      discountedPrice: 0,
    },
  });

  // Fetch the specialist program
  const { data: program, isLoading: programLoading } = useQuery<SpecialistProgram>({
    queryKey: [`/api/specialist-programs/${programId}`],
    enabled: !!programId,
  });

  // Fetch program courses
  const { data: programCourses = [], isLoading: coursesLoading } = useQuery<ProgramCourse[]>({
    queryKey: [`/api/specialist-programs/${programId}/courses`],
    enabled: !!programId,
  });

  // Get all available courses
  const { data: allCourses = [], isLoading: allCoursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  // Filter courses by search query
  const filteredCourses = allCourses
    ? allCourses
        .filter((course: Course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        // Only show short courses that aren't already selected
        .filter((course: Course) => 
          course.type === "short" && 
          !selectedCourses.some(selected => selected.courseId === course.id)
        )
    : [];

  // Initialize form with program data
  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        code: program.code,
        description: program.description,
        price: program.price,
        duration: program.duration,
        imageUrl: program.imageUrl || "",
        isActive: program.isActive,
        isVisible: program.isVisible,
        hasDiscounted: program.hasDiscounted,
        discountedPrice: program.discountedPrice || 0,
        discountExpiryDate: program.discountExpiryDate 
          ? new Date(program.discountExpiryDate).toISOString().split('T')[0]
          : undefined,
      });
    }
  }, [program, form]);

  // Initialize selected courses
  useEffect(() => {
    if (programCourses && programCourses.length > 0) {
      setSelectedCourses(programCourses);
    }
  }, [programCourses]);

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!programId) return null;
      
      // First update the program details
      const response = await apiRequest("PUT", `/api/specialist-programs/${programId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialist-programs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/specialist-programs/${programId}`] });
      toast({
        title: "Program Updated",
        description: "The specialist program has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update specialist program",
      });
    },
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: async (courseData: { programId: number, courseId: number, order: number, isRequired: boolean }) => {
      const response = await apiRequest("POST", "/api/specialist-program-courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/specialist-programs/${programId}/courses`] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add course to program",
      });
    },
  });

  // Remove course mutation
  const removeCourseMutation = useMutation({
    mutationFn: async (programCourseId: number) => {
      const response = await apiRequest("DELETE", `/api/specialist-program-courses/${programCourseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/specialist-programs/${programId}/courses`] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove course from program",
      });
    },
  });

  // Update course order mutation
  const updateCourseOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number, order: number}) => {
      const response = await apiRequest("PUT", `/api/specialist-program-courses/${id}`, { order });
      return response.json();
    },
  });

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async () => {
      if (!programId) return null;
      const response = await apiRequest("DELETE", `/api/specialist-programs/${programId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialist-programs"] });
      toast({
        title: "Program Deleted",
        description: "The specialist program has been deleted successfully.",
      });
      setLocation("/admin/courses/specialist");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete specialist program",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (selectedCourses.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "You must select at least one course for the specialist program",
      });
      return;
    }
    
    updateProgramMutation.mutate(data);
  };

  // Calculate total price of selected courses
  const calculateTotalPrice = () => {
    return selectedCourses.reduce((sum, programCourse) => {
      const course = allCourses?.find((c: Course) => c.id === programCourse.courseId);
      return sum + (course?.price || 0);
    }, 0);
  };

  // Add a course to the selected list
  const addCourse = (course: Course) => {
    if (!programId) return;
    
    const newOrder = selectedCourses.length + 1;
    const newCourseData = {
      programId,
      courseId: course.id,
      order: newOrder,
      isRequired: true
    };
    
    addCourseMutation.mutate(newCourseData, {
      onSuccess: (newProgramCourse) => {
        // Add the full course object to make it available in UI immediately
        setSelectedCourses([...selectedCourses, {
          ...newProgramCourse,
          course
        }]);
      }
    });
  };

  // Remove a course from the program
  const removeCourse = (programCourseId: number) => {
    removeCourseMutation.mutate(programCourseId, {
      onSuccess: () => {
        setSelectedCourses(selectedCourses.filter(pc => pc.id !== programCourseId));
      }
    });
  };

  // Confirm delete program
  const confirmDeleteProgram = () => {
    setIsConfirmDialogOpen(true);
  };

  // Execute delete program
  const executeDeleteProgram = () => {
    deleteProgramMutation.mutate();
    setIsConfirmDialogOpen(false);
  };

  // Show/hide discounted price field
  const watchHasDiscounted = form.watch("hasDiscounted");

  if (programLoading || !program) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Loading program...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/admin/courses/specialist")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Edit Specialist Program</h1>
          </div>
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" onClick={confirmDeleteProgram}>Delete Program</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the specialist program and remove all associations with courses.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeDeleteProgram}>
                  {deleteProgramMutation.isPending ? "Deleting..." : "Delete Program"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Program Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
                <CardDescription>
                  Edit the details of this specialist program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Web Development Specialist" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. WEBDEV" {...field} />
                          </FormControl>
                          <FormDescription>
                            A short unique code for this program (no spaces)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the specialist program" 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Package Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Suggested: ${calculateTotalPrice()} - discount
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (weeks)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>Optional: URL for program's featured image</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                            <div>
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Make this program active
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isVisible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                            <div>
                              <FormLabel>Visible</FormLabel>
                              <FormDescription>
                                Show on public listings
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="hasDiscounted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-3">
                          <div>
                            <FormLabel>Offer Special Discount</FormLabel>
                            <FormDescription>
                              Apply a limited-time discount
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {watchHasDiscounted && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="discountedPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discounted Price ($)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="discountExpiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Expiry Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setLocation("/admin/courses/specialist")}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateProgramMutation.isPending}
                      >
                        {updateProgramMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Course Selection Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selected Courses</CardTitle>
                <CardDescription>
                  Total: {selectedCourses.length} courses (${calculateTotalPrice()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCourses.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <p className="text-muted-foreground">
                      No courses selected. Add courses from the list below.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] rounded-md border">
                    <div className="p-4 space-y-3">
                      {selectedCourses.map((programCourse) => {
                        // Find the full course details
                        const course = allCourses?.find((c: Course) => c.id === programCourse.courseId) || programCourse.course;
                        
                        if (!course) return null;
                        
                        return (
                          <div key={programCourse.id} className="flex justify-between items-center p-2 border rounded-md">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{course.title}</h4>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {course.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ${course.price}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {course.duration} weeks
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeCourse(programCourse.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Courses</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <CardDescription>
                  Select courses to include in this specialist program
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allCoursesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading courses...</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <p className="text-muted-foreground">
                      No matching courses found. Try a different search or all courses may already be selected.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-4 space-y-4">
                      {filteredCourses.map((course: Course) => (
                        <div 
                          key={course.id} 
                          className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => addCourse(course)}
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium">{course.title}</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                addCourse(course);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {course.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ${course.price}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {course.duration} weeks
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}