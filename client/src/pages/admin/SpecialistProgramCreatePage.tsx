import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import axios from "axios";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Define validation schema for the form
const createProgramSchema = z.object({
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

type FormValues = z.infer<typeof createProgramSchema>;

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

export default function SpecialistProgramCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(createProgramSchema),
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

  // Get available courses
  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
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
          !selectedCourses.some(selected => selected.id === course.id)
        )
    : [];

  // Create specialist program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First create the program
      const response = await apiRequest("POST", "/api/specialist-programs", data);
      const program = await response.json();
      
      // Then add the courses to the program
      if (selectedCourses.length > 0) {
        for (let i = 0; i < selectedCourses.length; i++) {
          const courseData = {
            programId: program.id,
            courseId: selectedCourses[i].id,
            order: i + 1,
            isRequired: true
          };
          
          await apiRequest("POST", "/api/specialist-program-courses", courseData);
        }
      }
      
      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialist-programs"] });
      toast({
        title: "Specialist Program Created",
        description: "The program has been created successfully.",
      });
      setLocation("/admin/courses/specialist");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create specialist program",
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
    
    createProgramMutation.mutate(data);
  };

  // Calculate total price of selected courses
  const calculateTotalPrice = () => {
    return selectedCourses.reduce((sum, course) => sum + course.price, 0);
  };

  // Add a course to the selected list
  const addCourse = (course: Course) => {
    setSelectedCourses([...selectedCourses, course]);
  };

  // Remove a course from the selected list
  const removeCourse = (courseId: number) => {
    setSelectedCourses(selectedCourses.filter(course => course.id !== courseId));
  };

  // Calculate suggested price (80% of total as a default discount)
  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    const suggestedPrice = Math.round(totalPrice * 0.8); // 20% discount
    form.setValue("price", suggestedPrice);
  }, [selectedCourses]);
  
  // Update form with total duration
  useEffect(() => {
    const totalDuration = selectedCourses.reduce((sum, course) => sum + course.duration, 0);
    form.setValue("duration", totalDuration);
  }, [selectedCourses]);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post('/api/upload/specialist-program-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.fileUrl) {
        form.setValue('imageUrl', response.data.fileUrl);
        toast({
          title: "Image uploaded",
          description: "The image was uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload the image. Please try again."
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show/hide discounted price field
  const watchHasDiscounted = form.watch("hasDiscounted");

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
            <h1 className="text-2xl font-bold tracking-tight">Create Specialist Program</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Program Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
                <CardDescription>
                  Create a bundle of courses with a discounted price
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
                          <FormLabel>Program Image</FormLabel>
                          <div className="space-y-4">
                            {/* Hidden input for the URL, managed by the upload process */}
                            <Input type="hidden" {...field} />
                            
                            {/* File upload input */}
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  id="programImage"
                                  ref={fileInputRef}
                                  className="max-w-xs"
                                  onChange={handleFileUpload}
                                  disabled={isUploading}
                                />
                                {isUploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                Accepted formats: JPG, PNG, GIF, WEBP (max 5MB)
                              </div>
                            </div>
                            
                            {/* Image preview */}
                            {(previewImage || field.value) && (
                              <div className="mt-2 border rounded-md p-2 max-w-xs">
                                <div className="text-sm font-medium mb-1">Preview:</div>
                                <img 
                                  src={previewImage || field.value} 
                                  alt="Program cover preview" 
                                  className="max-h-[150px] object-cover rounded-md"
                                />
                              </div>
                            )}
                            
                            {/* Manual URL input as fallback */}
                            {!previewImage && (
                              <div className="flex flex-col space-y-1">
                                <div className="text-xs text-muted-foreground mt-2">
                                  Or enter image URL manually:
                                </div>
                                <Input 
                                  placeholder="https://example.com/image.jpg" 
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
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
                        disabled={createProgramMutation.isPending}
                      >
                        {createProgramMutation.isPending ? "Creating..." : "Create Program"}
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
                      {selectedCourses.map((course) => (
                        <div key={course.id} className="flex justify-between items-center p-2 border rounded-md">
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
                            onClick={() => removeCourse(course.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading courses...</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <p className="text-muted-foreground">
                      No matching courses found. Try a different search.
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