import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Clock, 
  Info,
  Check, 
  X,
  Filter,
  ArrowUpDown,
  Calendar,
  Book
} from 'lucide-react';

import { apiRequest } from '@/lib/queryClient';
import { 
  convertKeysToSnakeCase, 
  convertKeysToCamelCase,
  mapExamToFormData,
  mapFormDataToExam,
  mapQuestionFormDataForApi
} from '@/lib/dataUtils';
import { insertExamSchema } from '@shared/schema';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface Exam {
  id: number;
  title: string;
  description: string | null;
  type: string;
  max_score: number;  // Changed from totalPoints
  passing_score: number; // Changed from passingPoints
  time_limit: number; // Changed from duration
  status: string; // Changed from isActive (string instead of boolean)
  grading_mode: string; // 'auto' or 'manual'
  course_id: number; // Changed from courseId
  course?: {
    title: string;
    type: string;
  };
  section_id?: number | null; // Changed from sectionId
  semester_id?: number | null; // Changed from semesterId
  grade_a_threshold?: number;
  grade_b_threshold?: number;
  grade_c_threshold?: number;
  grade_d_threshold?: number;
  available_from?: string | null;
  available_to?: string | null;
  created_at: string; // Changed from createdAt
  questions?: ExamQuestion[];
  questionCount?: number;
}

interface ExamQuestion {
  id: number;
  examId: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
  explanation?: string;
}

interface Course {
  id: number;
  title: string;
  type: string;
}

interface CourseSection {
  id: number;
  title: string;
  courseId: number;
  moduleId?: number;
}

interface Semester {
  id: number;
  name: string;
  courseId: number;
}

// Form schema that matches the snake_case field names expected by the backend
const examFormSchema = z.object({
  title: z.string({
    required_error: "Please enter a title",
  }).min(3, {
    message: "Title must be at least 3 characters",
  }),
  description: z.string().optional().nullable(),
  type: z.enum(['quiz', 'midterm', 'final', 're_exam', 'assignment', 'project', 'practical'], {
    required_error: "Please select an exam type",
  }),
  status: z.string().default('active'),
  // Grading mode - auto or manual
  gradingMode: z.enum(['auto', 'manual'], {
    required_error: "Please select a grading mode",
  }).default('auto'),
  // In our form we use camelCase, but we're calling these snake_case in API
  courseId: z.number({
    required_error: "Please select a course",
  }),
  maxScore: z.number({
    required_error: "Please enter total points",
  }).min(1, {
    message: "Total points must be at least 1",
  }),
  passingScore: z.number({
    required_error: "Please enter passing points",
  }).min(1, {
    message: "Passing points must be at least 1",
  }),
  timeLimit: z.number({
    required_error: "Please enter duration in minutes",
  }).min(1, {
    message: "Duration must be at least 1 minute",
  }),
  // Optional fields
  sectionId: z.number().optional().nullable(),
  semesterId: z.number().optional().nullable(),
  // Grade thresholds
  gradeAThreshold: z.number().default(90).optional(),
  gradeBThreshold: z.number().default(80).optional(),
  gradeCThreshold: z.number().default(70).optional(),
  gradeDThreshold: z.number().default(60).optional(),
  // Availability dates
  availableFrom: z.string().optional().nullable(),
  availableTo: z.string().optional().nullable(),
});

const questionFormSchema = z.object({
  question: z.string().min(3, {
    message: "Question must be at least 3 characters",
  }),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay'], {
    required_error: "Please select a question type",
  }),
  options: z.array(z.string()).optional().nullable(),
  correctAnswer: z.string().min(1, {
    message: "Please provide the correct answer",
  }),
  points: z.number().min(1, {
    message: "Points must be at least 1",
  }).default(1),
  explanation: z.string().optional().nullable(),
  order: z.number().optional().default(1),
});

type ExamFormValues = z.infer<typeof examFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function ExamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for UI
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ExamQuestion | null>(null);
  const [courseFilter, setCourseFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [isViewingQuestions, setIsViewingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Form setup for exam
  const examForm = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "quiz",
      maxScore: 100,
      passingScore: 60,
      timeLimit: 60,
      status: "active",
      gradingMode: "auto",
      courseId: undefined,
      sectionId: undefined,
      semesterId: undefined,
      gradeAThreshold: 90,
      gradeBThreshold: 80,
      gradeCThreshold: 70,
      gradeDThreshold: 60,
      availableFrom: undefined,
      availableTo: undefined
    },
  });

  // Form setup for questions
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      explanation: "",
    },
  });

  // Queries
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['/api/admin/exams'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/exams');
      return response as Exam[];
    },
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/courses');
      return response as Course[];
    },
  });

  const { data: sections = [], isLoading: isLoadingSections } = useQuery({
    queryKey: ['/api/course-sections', currentExam?.course_id],
    queryFn: async () => {
      if (!currentExam?.course_id) return [];
      const response = await apiRequest(`/api/course-sections?courseId=${currentExam.course_id}`);
      return response as CourseSection[];
    },
    enabled: !!currentExam?.course_id,
  });

  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['/api/semesters', currentExam?.course_id],
    queryFn: async () => {
      if (!currentExam?.course_id) return [];
      const response = await apiRequest(`/api/semesters?courseId=${currentExam.course_id}`);
      return response as Semester[];
    },
    enabled: !!currentExam?.course_id,
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/admin/exams', currentExam?.id, 'questions'],
    queryFn: async () => {
      if (!currentExam?.id) return [];
      const response = await apiRequest(`/api/admin/exams/${currentExam.id}/questions`);
      return response as ExamQuestion[];
    },
    enabled: !!currentExam?.id && isViewingQuestions,
  });

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues) => {
      console.log("Form data before submission:", data);
      
      // Map the form data but keep consistent camelCase naming
      const examData = mapFormDataToExam(data);
      
      console.log("Sending exam data:", examData);
      
      return await apiRequest('/api/admin/exams', {
        method: 'POST',
        data: examData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsExamModalOpen(false);
      toast({
        title: "Exam Created",
        description: "The exam has been created successfully.",
      });
      examForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues & { id: number }) => {
      const { id, ...formData } = data;
      console.log("Form data before update:", formData);
      
      // Map form data but keep consistent camelCase naming
      const examData = mapFormDataToExam(formData);
      
      console.log("Sending updated exam data:", examData);
      
      return await apiRequest(`/api/admin/exams/${id}`, {
        method: 'PATCH',
        data: examData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsExamModalOpen(false);
      toast({
        title: "Exam Updated",
        description: "The exam has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exam. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/exams/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsDeleteModalOpen(false);
      setCurrentExam(null);
      toast({
        title: "Exam Deleted",
        description: "The exam has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { examId: number }) => {
      const { examId, ...questionData } = data;
      console.log("Question data before submission:", questionData);
      
      // Use the specialized function to map question data with correct field conversions
      const transformedData = mapQuestionFormDataForApi(questionData);
      console.log("Sending question data with proper field conversions:", transformedData);
      
      return await apiRequest(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        data: transformedData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams', currentExam?.id, 'questions'] });
      setIsQuestionModalOpen(false);
      toast({
        title: "Question Added",
        description: "The question has been added successfully.",
      });
      questionForm.reset({
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        explanation: "",
      });
      setAddingQuestion(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add question. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { examId: number, id: number }) => {
      const { examId, id, ...questionData } = data;
      console.log("Question data before update:", questionData);
      
      // Use the specialized function to map question data with correct field conversions
      const transformedData = mapQuestionFormDataForApi(questionData);
      console.log("Sending updated question data with proper field conversions:", transformedData);
      
      return await apiRequest(`/api/admin/exams/${examId}/questions/${id}`, {
        method: 'PATCH',
        data: transformedData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams', currentExam?.id, 'questions'] });
      setIsQuestionModalOpen(false);
      toast({
        title: "Question Updated",
        description: "The question has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async ({ examId, questionId }: { examId: number, questionId: number }) => {
      return await apiRequest(`/api/admin/exams/${examId}/questions/${questionId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams', currentExam?.id, 'questions'] });
      setIsDeleteModalOpen(false);
      setCurrentQuestion(null);
      toast({
        title: "Question Deleted",
        description: "The question has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const openExamModal = (exam?: Exam) => {
    if (exam) {
      setCurrentExam(exam);
      console.log("Original exam data:", exam);
      
      // Use the utility function to map exam data to form values
      const formData = mapExamToFormData(exam);
      console.log("Mapped exam data for form:", formData);
      
      // Set form values
      examForm.reset(formData);
    } else {
      setCurrentExam(null);
      examForm.reset({
        title: "",
        description: "",
        type: "quiz",
        maxScore: 100,
        passingScore: 60,
        timeLimit: 60,
        status: "active",
        gradingMode: "auto",
        courseId: undefined, // Explicitly set courseId to undefined
        sectionId: undefined,
        semesterId: undefined,
        gradeAThreshold: 90,
        gradeBThreshold: 80,
        gradeCThreshold: 70,
        gradeDThreshold: 60,
        availableFrom: undefined,
        availableTo: undefined
      });
    }
    setIsExamModalOpen(true);
  };

  const openQuestionModal = (question?: ExamQuestion) => {
    if (!currentExam) return;
    
    if (question) {
      setCurrentQuestion(question);
      questionForm.reset({
        ...question,
        options: question.options || [],
        explanation: question.explanation || "",
      });
    } else {
      setCurrentQuestion(null);
      questionForm.reset({
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        explanation: "",
      });
      setAddingQuestion(true);
    }
    setIsQuestionModalOpen(true);
  };

  const confirmDelete = (exam: Exam) => {
    setCurrentExam(exam);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = (question: ExamQuestion) => {
    setCurrentQuestion(question);
    setIsDeleteModalOpen(true);
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredExams = exams
    .filter(exam => {
      const matchesCourse = !courseFilter || exam.course_id === courseFilter;
      const matchesType = !typeFilter || exam.type === typeFilter;
      const matchesSearch = searchQuery.trim() === "" || 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCourse && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "max_score":
          comparison = a.max_score - b.max_score;
          break;
        case "time_limit":
          comparison = a.time_limit - b.time_limit;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleExamFormSubmit = (data: ExamFormValues) => {
    console.log("Form data before submission:", data);
    
    // Log any form validation errors
    if (Object.keys(examForm.formState.errors).length > 0) {
      console.error("Form has validation errors:", examForm.formState.errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }
    
    if (currentExam) {
      updateExamMutation.mutate({ ...data, id: currentExam.id });
    } else {
      createExamMutation.mutate(data);
    }
  };

  const handleQuestionFormSubmit = (data: QuestionFormValues) => {
    if (!currentExam) return;
    
    if (currentQuestion) {
      updateQuestionMutation.mutate({
        ...data,
        examId: currentExam.id,
        id: currentQuestion.id,
      });
    } else {
      createQuestionMutation.mutate({
        ...data,
        examId: currentExam.id,
      });
    }
  };

  const viewExamQuestions = (exam: Exam) => {
    setCurrentExam(exam);
    setIsViewingQuestions(true);
  };

  const backToExams = () => {
    setIsViewingQuestions(false);
    setCurrentExam(null);
  };

  // JSX rendering
  if (isViewingQuestions && currentExam) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Questions for {currentExam.title}</h1>
              <p className="text-muted-foreground">
                {currentExam.type.charAt(0).toUpperCase() + currentExam.type.slice(1)} | 
                Total Points: {currentExam.max_score} | 
                Duration: {currentExam.time_limit} minutes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={backToExams}>
                Back to Exams
              </Button>
              <Button onClick={() => openQuestionModal()}>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exam Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingQuestions ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No questions added yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => openQuestionModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Add your first question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Q{index + 1}.</span>
                              <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                              <Badge>{question.points} {question.points === 1 ? 'point' : 'points'}</Badge>
                            </div>
                            <div className="mb-4">{question.question}</div>
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="grid gap-2 ml-6">
                                {question.options.map((option, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${option === question.correctAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'}`}>
                                      {option === question.correctAnswer && <Check className="h-3 w-3" />}
                                    </div>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'true_false' && (
                              <div className="grid gap-2 ml-6">
                                <div className={`flex items-center gap-2`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${question.correctAnswer === 'true' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'}`}>
                                    {question.correctAnswer === 'true' && <Check className="h-3 w-3" />}
                                  </div>
                                  <span>True</span>
                                </div>
                                <div className={`flex items-center gap-2`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${question.correctAnswer === 'false' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'}`}>
                                    {question.correctAnswer === 'false' && <Check className="h-3 w-3" />}
                                  </div>
                                  <span>False</span>
                                </div>
                              </div>
                            )}
                            
                            {['short_answer', 'essay'].includes(question.type) && (
                              <div className="ml-6">
                                <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                                <div className="p-2 border rounded bg-muted/50">{question.correctAnswer}</div>
                              </div>
                            )}
                            
                            {question.explanation && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Explanation:</p>
                                <p className="text-sm">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => openQuestionModal(question)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteQuestion(question)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Form Modal */}
        <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
              <DialogDescription>
                {currentQuestion 
                  ? "Update the question details below."
                  : "Fill in the details to add a new question to this exam."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(handleQuestionFormSubmit)} className="space-y-6">
                <FormField
                  control={questionForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your question here" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={questionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset options when changing question type
                          if (value === 'multiple_choice') {
                            questionForm.setValue('options', ["", "", "", ""]);
                          } else if (value === 'true_false') {
                            questionForm.setValue('options', null);
                            questionForm.setValue('correctAnswer', 'true');
                          } else {
                            questionForm.setValue('options', null);
                            questionForm.setValue('correctAnswer', '');
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select question type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem 
                            value="short_answer" 
                            disabled={currentExam?.grading_mode === 'auto'}
                          >
                            Short Answer {currentExam?.grading_mode === 'auto' && "(requires manual grading)"}
                          </SelectItem>
                          <SelectItem 
                            value="essay" 
                            disabled={currentExam?.grading_mode === 'auto'}
                          >
                            Essay {currentExam?.grading_mode === 'auto' && "(requires manual grading)"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {questionForm.watch('type') === 'multiple_choice' && (
                  <div className="space-y-4">
                    <FormLabel>Options</FormLabel>
                    <FormDescription>
                      Add multiple choice options below. Select the correct answer.
                    </FormDescription>
                    {questionForm.watch('options')?.map((_, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border cursor-pointer ${
                            questionForm.watch('correctAnswer') === questionForm.watch(`options.${index}`) 
                              ? 'bg-green-100 border-green-500 text-green-700' 
                              : 'border-gray-300'
                          }`}
                          onClick={() => {
                            const option = questionForm.watch(`options.${index}`);
                            if (option) questionForm.setValue('correctAnswer', option);
                          }}
                        >
                          {questionForm.watch('correctAnswer') === questionForm.watch(`options.${index}`) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <Input
                          value={questionForm.watch(`options.${index}`) || ''}
                          onChange={(e) => {
                            const newOptions = [...(questionForm.watch('options') || [])];
                            newOptions[index] = e.target.value;
                            questionForm.setValue('options', newOptions);
                            
                            // If this was the correct answer, update it
                            if (questionForm.watch('correctAnswer') === questionForm.watch(`options.${index}`)) {
                              questionForm.setValue('correctAnswer', e.target.value);
                            }
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        {index > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newOptions = [...(questionForm.watch('options') || [])];
                              newOptions.splice(index, 1);
                              questionForm.setValue('options', newOptions);
                              
                              // If this was the correct answer, reset it
                              if (questionForm.watch('correctAnswer') === questionForm.watch(`options.${index}`)) {
                                questionForm.setValue('correctAnswer', '');
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {(questionForm.watch('options')?.length || 0) < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentOptions = questionForm.watch('options') || [];
                          questionForm.setValue('options', [...currentOptions, '']);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Option
                      </Button>
                    )}
                  </div>
                )}
                
                {questionForm.watch('type') === 'true_false' && (
                  <FormField
                    control={questionForm.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {['short_answer', 'essay'].includes(questionForm.watch('type')) && (
                  <FormField
                    control={questionForm.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter the correct answer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={questionForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={questionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain the correct answer" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        This will be shown to students after they submit their answer or complete the exam.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={questionForm.formState.isSubmitting || createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                    {questionForm.formState.isSubmitting || createQuestionMutation.isPending || updateQuestionMutation.isPending ? (
                      <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      {currentQuestion ? "Updating..." : "Adding..."}</>
                    ) : (
                      currentQuestion ? "Update Question" : "Add Question"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Question Confirmation Modal */}
        <Dialog open={isDeleteModalOpen && !!currentQuestion} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (currentQuestion && currentExam) {
                    deleteQuestionMutation.mutate({ 
                      examId: currentExam.id, 
                      questionId: currentQuestion.id 
                    });
                  }
                }}
                disabled={deleteQuestionMutation.isPending}
              >
                {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
          <Button onClick={() => openExamModal()}>
            <Plus className="mr-2 h-4 w-4" /> Create Exam
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row justify-between mb-6">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Course</h4>
                    <Select
                      value={courseFilter?.toString() || ""}
                      onValueChange={(value) => setCourseFilter(value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Exam Type</h4>
                    <Select
                      value={typeFilter || ""}
                      onValueChange={(value) => setTypeFilter(value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="re_exam">Re-Examination</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setCourseFilter(undefined);
                      setTypeFilter(undefined);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSortChange("title")}>
                    <div className="flex items-center">
                      Title
                      {sortField === "title" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSortChange("type")}>
                    <div className="flex items-center">
                      Type
                      {sortField === "type" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSortChange("max_score")}>
                    <div className="flex items-center">
                      Points
                      {sortField === "max_score" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSortChange("time_limit")}>
                    <div className="flex items-center">
                      Duration
                      {sortField === "time_limit" && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingExams ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No exams found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exam.type.charAt(0).toUpperCase() + exam.type.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Book className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]" title={exam.course?.title}>
                            {exam.course?.title || "Unknown Course"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{exam.max_score} pts</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.time_limit} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {exam.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                        ) : exam.status === 'draft' ? (
                          <Badge variant="secondary">Draft</Badge>
                        ) : (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeof exam.questionCount === 'undefined' ? '?' : exam.questionCount} Questions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => viewExamQuestions(exam)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manage Questions</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openExamModal(exam)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Exam</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => confirmDelete(exam)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Exam</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Exam Form Modal */}
      <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>{currentExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
            <DialogDescription>
              {currentExam 
                ? "Update the exam details below."
                : "Fill in the details to create a new exam."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...examForm}>
            <form onSubmit={examForm.handleSubmit(handleExamFormSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={examForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter exam title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={examForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a description for this exam" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about the exam, its purpose, and any special instructions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={examForm.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course*</FormLabel>
                          <Select
                            value={field.value?.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map((course) => (
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
                      control={examForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Type*</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="midterm">Midterm</SelectItem>
                              <SelectItem value="final">Final Exam</SelectItem>
                              <SelectItem value="re_exam">Re-Examination</SelectItem>
                              <SelectItem value="assignment">Assignment</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="practical">Practical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={examForm.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Points*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="passingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Points*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={examForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                        <FormDescription>
                          Active exams are visible to students and available for taking.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={examForm.control}
                    name="gradingMode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Grading Mode</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="auto" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Auto-graded
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="manual" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Manually graded
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Auto-graded exams are scored automatically, while manually graded exams require teacher review.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="sectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Section (Optional)</FormLabel>
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            disabled={!examForm.watch('courseId') || isLoadingSections}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select course section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No specific section</SelectItem>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id.toString()}>
                                  {section.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Associate this exam with a specific course section.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="semesterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester (Optional)</FormLabel>
                          <Select
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            disabled={!examForm.watch('courseId') || isLoadingSemesters}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No specific semester</SelectItem>
                              {semesters.map((semester) => (
                                <SelectItem key={semester.id} value={semester.id.toString()}>
                                  {semester.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Associate this exam with a specific semester.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="availableFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available From (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            When this exam becomes available to students.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="availableTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Until (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              value={field.value || ''} 
                            />
                          </FormControl>
                          <FormDescription>
                            When this exam is no longer available to students.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={examForm.control}
                      name="gradeAThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade A (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 90)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="gradeBThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade B (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 80)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="gradeCThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade C (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 70)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={examForm.control}
                      name="gradeDThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade D (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 60)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsExamModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={examForm.formState.isSubmitting || createExamMutation.isPending || updateExamMutation.isPending}>
                  {examForm.formState.isSubmitting || createExamMutation.isPending || updateExamMutation.isPending ? (
                    <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    {currentExam ? "Updating..." : "Creating..."}</>
                  ) : (
                    currentExam ? "Update Exam" : "Create Exam"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen && !!currentExam && !currentQuestion} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the exam "{currentExam?.title}"? This will also delete all questions and 
              results associated with this exam. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => currentExam && deleteExamMutation.mutate(currentExam.id)}
              disabled={deleteExamMutation.isPending}
            >
              {deleteExamMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}