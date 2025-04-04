import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, UserCircle, ListFilter, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Form schema for grades
const gradeFormSchema = z.object({
  score: z.coerce.number().min(0, { message: "Score cannot be negative" }),
  grade: z.string().min(1, { message: "Please select a grade" }),
  remarks: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

// Sample data for demonstration
const sampleExamSubmissions = [
  {
    id: 1,
    examId: 1,
    examTitle: "JavaScript Fundamentals",
    courseId: 1,
    courseTitle: "Frontend Web Development",
    studentId: 101,
    studentName: "John Doe",
    status: "submitted",
    submittedAt: "2025-04-01T14:30:00",
    answers: [
      {
        questionId: 1,
        question: "What is the output of console.log(typeof null)?",
        answer: "object",
        correct: true,
        points: 1,
      },
      {
        questionId: 2,
        question: "Which method is used to add elements to the end of an array?",
        answer: "push()",
        correct: true,
        points: 1,
      },
      {
        questionId: 3,
        question: "Explain the concept of hoisting in JavaScript.",
        answer: "Hoisting is JavaScript's default behavior of moving declarations to the top of the current scope. Variables declared with var are hoisted to the top of their function or global scope and initialized with undefined. Function declarations are also hoisted and can be called before they're defined.",
        correct: null, // Needs manual grading
        points: null,
      },
    ],
    score: null,
    grade: null,
    remarks: null,
  },
  {
    id: 2,
    examId: 1,
    examTitle: "JavaScript Fundamentals",
    courseId: 1,
    courseTitle: "Frontend Web Development",
    studentId: 102,
    studentName: "Jane Smith",
    status: "submitted",
    submittedAt: "2025-04-01T15:20:00",
    answers: [
      {
        questionId: 1,
        question: "What is the output of console.log(typeof null)?",
        answer: "string",
        correct: false,
        points: 0,
      },
      {
        questionId: 2,
        question: "Which method is used to add elements to the end of an array?",
        answer: "push()",
        correct: true,
        points: 1,
      },
      {
        questionId: 3,
        question: "Explain the concept of hoisting in JavaScript.",
        answer: "Hoisting means variables can be used before they are declared in JavaScript.",
        correct: null, // Needs manual grading
        points: null,
      },
    ],
    score: null,
    grade: null,
    remarks: null,
  },
  {
    id: 3,
    examId: 2,
    examTitle: "UX Design Principles",
    courseId: 2,
    courseTitle: "UX/UI Fundamentals",
    studentId: 103,
    studentName: "Michael Johnson",
    status: "submitted",
    submittedAt: "2025-04-02T10:15:00",
    answers: [],
    score: null,
    grade: null,
    remarks: null,
  },
];

// Sample exams for dropdown
const sampleExams = [
  { id: 1, title: "JavaScript Fundamentals" },
  { id: 2, title: "UX Design Principles" },
  { id: 3, title: "Database Design Quiz" },
];

// Sample courses for dropdown
const sampleCourses = [
  { id: 1, title: "Frontend Web Development" },
  { id: 2, title: "UX/UI Fundamentals" },
  { id: 3, title: "Backend Database Systems" },
];

export default function ExamMarks() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showNeedingGrading, setShowNeedingGrading] = useState(true);
  const [showGraded, setShowGraded] = useState(true);

  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState(sampleExamSubmissions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup grade form
  const gradeForm = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      score: 0,
      grade: "",
      remarks: "",
    },
  });

  // Filter submissions based on various criteria
  const filteredSubmissions = submissions.filter(submission => {
    // Apply exam filter
    if (selectedExamId && submission.examId !== parseInt(selectedExamId)) {
      return false;
    }

    // Apply course filter
    if (selectedCourseId && submission.courseId !== parseInt(selectedCourseId)) {
      return false;
    }

    // Apply grading status filter
    const isGraded = submission.grade !== null;
    if (!showGraded && isGraded) {
      return false;
    }
    if (!showNeedingGrading && !isGraded) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        submission.studentName.toLowerCase().includes(query) ||
        submission.examTitle.toLowerCase().includes(query) ||
        submission.courseTitle.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle opening grading dialog
  const openGradingDialog = (submission: any) => {
    setSelectedSubmission(submission);
    const defaultScore = calculateDefaultScore(submission);

    gradeForm.reset({
      score: submission.score ?? defaultScore,
      grade: submission.grade ?? determineGradeFromScore(defaultScore),
      remarks: submission.remarks ?? "",
    });
    
    setIsGradingDialogOpen(true);
  };

  // Calculate score from auto-graded questions
  const calculateDefaultScore = (submission: any) => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    submission.answers.forEach((answer: any) => {
      if (answer.correct !== null) {
        if (answer.points !== null) {
          totalPoints += 1;
          earnedPoints += answer.correct ? answer.points : 0;
        }
      }
    });
    
    return totalPoints > 0 ? earnedPoints : 0;
  };

  // Determine grade based on score percentage
  const determineGradeFromScore = (score: number) => {
    const totalPossiblePoints = 100; // This would normally be calculated based on the exam's max score
    const percentage = (score / totalPossiblePoints) * 100;
    
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  // Handle form submission
  const onSubmitGrade = (values: GradeFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update the submissions state
      const updatedSubmissions = submissions.map(submission => {
        if (submission.id === selectedSubmission.id) {
          return {
            ...submission,
            score: values.score,
            grade: values.grade,
            remarks: values.remarks,
            status: "graded",
          };
        }
        return submission;
      });
      
      setSubmissions(updatedSubmissions);
      setIsSubmitting(false);
      setIsGradingDialogOpen(false);
      
      toast({
        title: "Exam graded successfully",
        description: `${selectedSubmission.studentName}'s exam has been graded.`,
      });
    }, 1000);
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Marking</h1>
            <p className="text-muted-foreground">
              Grade and provide feedback on student exam submissions.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Submissions</CardTitle>
            <CardDescription>
              View, grade, and manage student exam submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col xs:flex-row gap-4">
                  <div className="w-full sm:w-64">
                    <Label htmlFor="exam-filter">Filter by Exam</Label>
                    <Select
                      value={selectedExamId || ""}
                      onValueChange={(value) => setSelectedExamId(value === "" ? null : value)}
                    >
                      <SelectTrigger id="exam-filter">
                        <SelectValue placeholder="All Exams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Exams</SelectItem>
                        {sampleExams.map(exam => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            {exam.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-64">
                    <Label htmlFor="course-filter">Filter by Course</Label>
                    <Select
                      value={selectedCourseId || ""}
                      onValueChange={(value) => setSelectedCourseId(value === "" ? null : value)}
                    >
                      <SelectTrigger id="course-filter">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Courses</SelectItem>
                        {sampleCourses.map(course => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search submissions..."
                      className="pl-8 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="needs-grading"
                    checked={showNeedingGrading}
                    onChange={(e) => setShowNeedingGrading(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="needs-grading">Needs Grading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="graded"
                    checked={showGraded}
                    onChange={(e) => setShowGraded(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="graded">Graded</Label>
                </div>
                <Badge variant="outline">
                  {filteredSubmissions.length} {filteredSubmissions.length === 1 ? "Submission" : "Submissions"}
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No exam submissions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-6 w-6 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{submission.studentName}</div>
                                <div className="text-xs text-muted-foreground">ID: {submission.studentId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{submission.examTitle}</TableCell>
                          <TableCell>{submission.courseTitle}</TableCell>
                          <TableCell>
                            {submission.submittedAt ? formatDate(submission.submittedAt) : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={
                                submission.status === "graded" 
                                  ? "success" 
                                  : submission.status === "submitted" 
                                    ? "secondary" 
                                    : "outline"
                              }
                            >
                              {submission.status === "graded" 
                                ? "Graded" 
                                : submission.status === "submitted" 
                                  ? "Needs Grading" 
                                  : submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {submission.score !== null ? submission.score : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {submission.grade ? (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-semibold",
                                  submission.grade === "A" ? "bg-green-50 text-green-700 border-green-200" :
                                  submission.grade === "B" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  submission.grade === "C" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                  submission.grade === "D" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  submission.grade === "F" ? "bg-red-50 text-red-700 border-red-200" :
                                  ""
                                )}
                              >
                                {submission.grade}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => openGradingDialog(submission)}
                            >
                              {submission.status === "graded" ? "Edit Grade" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Dialog */}
      {selectedSubmission && (
        <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Grade Exam Submission</DialogTitle>
              <DialogDescription>
                {selectedSubmission.studentName}'s submission for {selectedSubmission.examTitle}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="answers">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="answers">Student Answers</TabsTrigger>
                <TabsTrigger value="grading">Grading</TabsTrigger>
              </TabsList>
              
              <TabsContent value="answers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Submission Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {selectedSubmission.submittedAt ? formatDate(selectedSubmission.submittedAt) : "N/A"}
                    </p>
                  </div>
                  <Badge variant="outline">{selectedSubmission.status}</Badge>
                </div>

                <div className="space-y-4">
                  {selectedSubmission.answers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No answers available to display.
                    </div>
                  ) : (
                    selectedSubmission.answers.map((answer: any, index: number) => (
                      <Card key={answer.questionId}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle className="text-sm font-medium">Question {index + 1}</CardTitle>
                              <CardDescription>{answer.question}</CardDescription>
                            </div>
                            {answer.correct !== null && (
                              <Badge 
                                variant={answer.correct ? "success" : "destructive"}
                                className={answer.correct 
                                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                  : "bg-red-100 text-red-800 hover:bg-red-100"}
                              >
                                {answer.correct ? "Correct" : "Incorrect"}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-muted-foreground">Student's Answer:</Label>
                              <div className="mt-1 p-3 border rounded-md bg-muted/30 text-sm">
                                {answer.answer}
                              </div>
                            </div>
                            {answer.correct === null && (
                              <div className="bg-yellow-50 text-yellow-800 p-2 rounded-md text-sm flex items-center">
                                <ListFilter className="h-4 w-4 mr-2" />
                                This answer requires manual grading.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="grading" className="space-y-4">
                <Form {...gradeForm}>
                  <form onSubmit={gradeForm.handleSubmit(onSubmitGrade)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={gradeForm.control}
                        name="score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  field.onChange(value);
                                  
                                  // Auto-update grade based on score if score is changed
                                  const newGrade = determineGradeFromScore(value);
                                  gradeForm.setValue("grade", newGrade);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the total points earned on this exam.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={gradeForm.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="D">D</SelectItem>
                                <SelectItem value="F">F</SelectItem>
                                <SelectItem value="incomplete">Incomplete</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Assign a letter grade for this exam.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={gradeForm.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks & Feedback</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide feedback to the student about their performance..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Your comments will be visible to the student.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsGradingDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> 
                            Save Grade
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}