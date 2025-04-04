import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().optional(),
  type: z.string().min(1, { message: "Please select an exam type" }),
  course_id: z.coerce.number().positive({ message: "Please select a course" }),
  section_id: z.coerce.number().optional(),
  semester_id: z.coerce.number().optional(),
  max_score: z.coerce.number().min(1, { message: "Maximum score must be at least 1" }),
  passing_score: z.coerce.number().min(1, { message: "Passing score must be at least 1" }),
  time_limit: z.coerce.number().min(1, { message: "Time limit must be at least 1 minute" }),
  status: z.string().default("active"),
  gradeAThreshold: z.coerce.number().min(1).max(100).default(90),
  gradeBThreshold: z.coerce.number().min(1).max(100).default(80),
  gradeCThreshold: z.coerce.number().min(1).max(100).default(70),
  gradeDThreshold: z.coerce.number().min(1).max(100).default(60),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ExamCreate() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch course data for the dropdown
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Set up form with Zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      max_score: 100,
      passing_score: 60,
      time_limit: 60,
      status: "active",
      gradeAThreshold: 90,
      gradeBThreshold: 80,
      gradeCThreshold: 70,
      gradeDThreshold: 60,
    },
  });

  // Watch course ID to enable fetching sections and semesters
  const selectedCourseId = form.watch("course_id");

  // Fetch sections based on selected course
  const { data: sections = [], isLoading: isLoadingSections } = useQuery({
    queryKey: ['/api/admin/course-sections', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const response = await fetch(`/api/admin/course-sections?courseId=${selectedCourseId}`);
      if (!response.ok) throw new Error('Failed to fetch sections');
      return response.json();
    },
    enabled: !!selectedCourseId,
  });

  // Fetch semesters based on selected course
  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['/api/admin/semesters', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const response = await fetch(`/api/admin/semesters?courseId=${selectedCourseId}`);
      if (!response.ok) throw new Error('Failed to fetch semesters');
      return response.json();
    },
    enabled: !!selectedCourseId,
  });

  // Create exam mutation
  const createExam = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create exam');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Exam created successfully',
        description: 'You can now add questions to this exam.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      // Redirect to the exam management page or to add questions
      navigate(`/admin/exams`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create exam',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    createExam.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-muted-foreground">
            Create a new exam for your course.
          </p>
        </div>

        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader className="space-y-1 px-4 pt-5 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">Exam Details</CardTitle>
            <CardDescription>
              Fill in the form below to create a new exam. You can add questions after creating the exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Exam Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter exam title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a description of this exam" 
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Exam Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Type*</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exam type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="midterm">Midterm Exam</SelectItem>
                            <SelectItem value="final">Final Exam</SelectItem>
                            <SelectItem value="re_exam">Re-Examination</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="practical">Practical Exam</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Course */}
                  <FormField
                    control={form.control}
                    name="course_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Reset section and semester when course changes
                            form.setValue("section_id", undefined);
                            form.setValue("semester_id", undefined);
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCourses ? (
                              <SelectItem value="loading">Loading courses...</SelectItem>
                            ) : (
                              courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
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

                  {/* Section (Optional) */}
                  <FormField
                    control={form.control}
                    name="section_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={!selectedCourseId || isLoadingSections}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCourseId ? (
                              <SelectItem value="select-course">Select a course first</SelectItem>
                            ) : isLoadingSections ? (
                              <SelectItem value="loading">Loading sections...</SelectItem>
                            ) : sections.length === 0 ? (
                              <SelectItem value="none">No sections available</SelectItem>
                            ) : (
                              sections.map((section: any) => (
                                <SelectItem key={section.id} value={section.id.toString()}>
                                  {section.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this exam to a specific section in the course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Semester (Optional) */}
                  <FormField
                    control={form.control}
                    name="semester_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={!selectedCourseId || isLoadingSemesters}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!selectedCourseId ? (
                              <SelectItem value="select-course">Select a course first</SelectItem>
                            ) : isLoadingSemesters ? (
                              <SelectItem value="loading">Loading semesters...</SelectItem>
                            ) : semesters.length === 0 ? (
                              <SelectItem value="none">No semesters available</SelectItem>
                            ) : (
                              semesters.map((semester: any) => (
                                <SelectItem key={semester.id} value={semester.id.toString()}>
                                  {semester.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this exam to a specific semester in the course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Max Score */}
                  <FormField
                    control={form.control}
                    name="max_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Score*</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Passing Score */}
                  <FormField
                    control={form.control}
                    name="passing_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score*</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time Limit */}
                  <FormField
                    control={form.control}
                    name="time_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)*</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
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
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grade A Threshold */}
                  <FormField
                    control={form.control}
                    name="gradeAThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade A Threshold (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage required to achieve an A grade.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grade B Threshold */}
                  <FormField
                    control={form.control}
                    name="gradeBThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade B Threshold (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage required to achieve a B grade.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grade C Threshold */}
                  <FormField
                    control={form.control}
                    name="gradeCThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade C Threshold (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage required to achieve a C grade.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grade D Threshold */}
                  <FormField
                    control={form.control}
                    name="gradeDThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade D Threshold (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage required to achieve a D grade.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Available From */}
                  <FormField
                    control={form.control}
                    name="availableFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available From (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The date from which this exam will be available to students.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Available To */}
                  <FormField
                    control={form.control}
                    name="availableTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available Until (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || (form.getValues("availableFrom") && date <= form.getValues("availableFrom"))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The date until which this exam will be available to students.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    After creating the exam, you will be able to add questions. Make sure to set up all exam details correctly before adding questions.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 pt-4 space-y-3 space-y-reverse sm:space-y-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto" 
                    onClick={() => navigate('/admin/exams')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? "Creating..." : "Create Exam"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}