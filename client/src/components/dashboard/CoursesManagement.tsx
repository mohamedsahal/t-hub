import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Pencil,
  Trash2,
  Plus,
  FileEdit,
  Ban,
  Clock,
  Calendar,
  DollarSign,
  Layers,
  Image,
  ClipboardCheck,
  Info,
  Search,
  CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

// Define validation schema based on the insertCourseSchema
const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["short_course", "group_course", "bootcamp", "diploma"]),
  category: z.enum(["multimedia", "accounting", "marketing", "development", "programming", "design", "business", "data_science"]).default("development"),
  shortName: z.string().min(2, "Short name must be at least 2 characters").default("CRS"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 week"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  imageUrl: z.string().optional(),
  teacherId: z.coerce.number().optional(),
  isHasExams: z.boolean().default(true),
  examPassingGrade: z.coerce.number().min(0).max(100).default(60),
  hasSemesters: z.boolean().default(false),
  numberOfSemesters: z.coerce.number().min(1).default(1),
  isDripping: z.boolean().default(false),
  hasOnlineSessions: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CoursesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Get all teachers for the teacher assignment dropdown
  const { data: teachers, isLoading: isTeachersLoading } = useQuery({
    queryKey: ['/api/admin/teachers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/teachers');
        return response;
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        return [];
      }
    }
  });

  // Get all courses
  const { data: courses, isLoading: isCoursesLoading, isError } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/courses');
        return response;
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        throw error;
      }
    }
  });

  // Create a new course
  const createCourseMutation = useMutation({
    mutationFn: async (newCourse: CourseFormValues) => {
      const response = await apiRequest('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(newCourse),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Course Created",
        description: "The course has been created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update an existing course
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CourseFormValues }) => {
      const response = await apiRequest(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Course Updated",
        description: "The course has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete a course
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Course Deleted",
        description: "The course has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form for adding a new course
  const addForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "short_course",
      category: "development",
      shortName: "CRS",
      duration: 4,
      price: 0,
      status: "draft",
      imageUrl: "",
      teacherId: undefined,
      isHasExams: true,
      examPassingGrade: 60,
      hasSemesters: false,
      numberOfSemesters: 1,
      isDripping: false,
      hasOnlineSessions: false,
    },
  });

  // Form for editing a course
  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "short_course",
      category: "development",
      shortName: "CRS",
      duration: 4,
      price: 0,
      status: "draft",
      imageUrl: "",
      teacherId: undefined,
      isHasExams: true,
      examPassingGrade: 60,
      hasSemesters: false,
      numberOfSemesters: 1,
      isDripping: false,
      hasOnlineSessions: false,
    },
  });

  // Handle adding a new course
  const onAddSubmit = (data: CourseFormValues) => {
    createCourseMutation.mutate(data);
  };

  // Handle editing a course
  const onEditSubmit = (data: CourseFormValues) => {
    if (selectedCourse) {
      updateCourseMutation.mutate({ id: selectedCourse.id, data });
    }
  };

  // Handle opening edit dialog and setting form values
  const handleEditClick = (course: any) => {
    setSelectedCourse(course);
    editForm.reset({
      title: course.title,
      description: course.description,
      type: course.type,
      duration: course.duration,
      price: course.price,
      status: course.status,
      imageUrl: course.imageUrl || "",
      teacherId: course.teacherId || undefined,
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDeleteClick = (course: any) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Handle deleting a course
  const handleDeleteConfirm = () => {
    if (selectedCourse) {
      deleteCourseMutation.mutate(selectedCourse.id);
    }
  };

  // Filter courses based on search query and active tab
  const filteredCourses = courses?.filter((course: any) => {
    const matchesQuery = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesQuery;
    return matchesQuery && course.status === activeTab;
  });

  // Get course type display
  const getCourseTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: { label: string; color: string } } = {
      short_course: { label: "Short Course", color: "bg-blue-100 text-blue-800" },
      group_course: { label: "Group Course", color: "bg-green-100 text-green-800" },
      bootcamp: { label: "Bootcamp", color: "bg-purple-100 text-purple-800" },
      diploma: { label: "Diploma", color: "bg-pink-100 text-pink-800" },
    };

    return typeMap[type] || { label: type, color: "bg-gray-100 text-gray-800" };
  };

  // Get course status display
  const getCourseStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      published: { label: "Published", color: "bg-green-100 text-green-800" },
      archived: { label: "Archived", color: "bg-amber-100 text-amber-800" },
    };

    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load courses</h3>
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
            placeholder="Search courses..."
            className="pl-8 w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isCoursesLoading ? (
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
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses && filteredCourses.length > 0 ? (
                    filteredCourses.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.id}</TableCell>
                        <TableCell>{course.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getCourseTypeDisplay(course.type).color} border-0`}>
                            {getCourseTypeDisplay(course.type).label}
                          </Badge>
                        </TableCell>
                        <TableCell>${course.price.toFixed(2)}</TableCell>
                        <TableCell>{course.duration} weeks</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getCourseStatusDisplay(course.status).color} border-0`}>
                            {getCourseStatusDisplay(course.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {course.teacherId ? (
                            (teachers?.find((t: any) => t.id === course.teacherId)?.name || 'Unknown')
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(course)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteClick(course)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No courses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course for the platform. Fill out all the required fields below.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short_course">Short Course</SelectItem>
                          <SelectItem value="group_course">Group Course</SelectItem>
                          <SelectItem value="bootcamp">Bootcamp</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed course description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
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
                <FormField
                  control={addForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Course image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for the course cover image (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign a teacher (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isTeachersLoading ? (
                            <div className="p-2">Loading teachers...</div>
                          ) : (
                            teachers?.map((teacher: any) => (
                              <SelectItem
                                key={teacher.id}
                                value={teacher.id.toString()}
                              >
                                {teacher.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a teacher to this course (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course information. Fill out all the required fields below.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="short_course">Short Course</SelectItem>
                          <SelectItem value="group_course">Group Course</SelectItem>
                          <SelectItem value="bootcamp">Bootcamp</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed course description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
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
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Course image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for the course cover image (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign a teacher (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Teacher</SelectItem>
                          {isTeachersLoading ? (
                            <div className="p-2">Loading teachers...</div>
                          ) : (
                            teachers?.map((teacher: any) => (
                              <SelectItem
                                key={teacher.id}
                                value={teacher.id.toString()}
                              >
                                {teacher.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a teacher to this course (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCourseMutation.isPending}>
                  {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCourse && (
              <div className="border rounded-md p-4">
                <h4 className="font-medium">{selectedCourse.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCourse.description.length > 100
                    ? `${selectedCourse.description.substring(0, 100)}...`
                    : selectedCourse.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={`${getCourseTypeDisplay(selectedCourse.type).color} border-0`}
                  >
                    {getCourseTypeDisplay(selectedCourse.type).label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${getCourseStatusDisplay(selectedCourse.status).color} border-0`}
                  >
                    {getCourseStatusDisplay(selectedCourse.status).label}
                  </Badge>
                </div>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                <span>Warning: This will also delete all enrollments and certificates associated with this course.</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}