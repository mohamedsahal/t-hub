import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Exam {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  sectionId: number | null;
  semesterId: number | null;
  type: 'quiz' | 'midterm' | 'final' | 're_exam';
  duration: number;
  totalPoints: number;
  passingPoints: number;
  isActive: boolean;
  availableFrom: string | null;
  availableTo: string | null;
}

interface ExamQuestion {
  id: number;
  examId: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  order: number;
  explanation: string | null;
}

interface Course {
  id: number;
  title: string;
}

const examFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional().nullable(),
  courseId: z.coerce.number().min(1, { message: 'Please select a course' }),
  // Type will be automatically set based on the active tab
  type: z.enum(['quiz', 'midterm', 'final', 're_exam']).default('quiz'),
  duration: z.coerce.number().min(1, { message: 'Duration is required' }),
  totalPoints: z.coerce.number().min(1, { message: 'Total points is required' }),
  passingPoints: z.coerce.number().min(1, { message: 'Passing points is required' }),
  isActive: z.boolean().default(true)
});

const questionFormSchema = z.object({
  question: z.string().min(1, { message: 'Question is required' }),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  options: z.array(z.string()).optional().nullable(),
  correctAnswer: z.string().optional().nullable(),
  points: z.coerce.number().min(1, { message: 'Points are required' }),
  explanation: z.string().optional().nullable(),
  order: z.coerce.number().default(1)
});

export function QuizManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('quizzes');
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<number | null>(null);

  // Query to get all quizzes
  const { data: exams = [] } = useQuery({
    queryKey: ['/api/admin/exams'],
    select: (data: Exam[]) => data.filter(exam => 
      activeTab === 'quizzes' ? exam.type === 'quiz' : exam.type !== 'quiz'
    ).filter(exam => 
      searchQuery 
        ? exam.title.toLowerCase().includes(searchQuery.toLowerCase()) 
        : true
    )
  });

  // Query to get courses for dropdown
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
  });

  // Query to get questions for a selected exam
  const { data: questions = [] } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/admin/exams', selectedExam?.id, 'questions'],
    enabled: !!selectedExam,
  });

  // Mutation for creating/updating an exam
  const examMutation = useMutation({
    mutationFn: (data: any) => {
      if (selectedExam) {
        return apiRequest(`/api/admin/exams/${selectedExam.id}`, {
          method: 'PATCH',
          data
        });
      } else {
        return apiRequest('/api/admin/exams', {
          method: 'POST',
          data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsExamDialogOpen(false);
      setSelectedExam(null);
      toast({
        title: selectedExam ? 'Exam updated' : 'Exam created',
        description: `The exam was ${selectedExam ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error: any) => {
      console.error('Error saving exam:', error);
      
      // Check if there are validation errors
      if (error.response?.data?.message) {
        toast({
          title: 'Validation Error',
          description: error.response.data.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${selectedExam ? 'update' : 'create'} exam. Please make sure all required fields are filled.`,
          variant: 'destructive',
        });
      }
      
      // Log form errors for debugging
      console.log('Form state:', examForm.formState);
    }
  });

  // Mutation for creating/updating a question
  const questionMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedExam) {
        throw new Error('No exam selected');
      }
      
      if (selectedQuestion) {
        return apiRequest(`/api/admin/exams/${selectedExam.id}/questions/${selectedQuestion.id}`, {
          method: 'PATCH',
          data
        });
      } else {
        return apiRequest(`/api/admin/exams/${selectedExam.id}/questions`, {
          method: 'POST',
          data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams', selectedExam?.id, 'questions'] });
      setIsQuestionDialogOpen(false);
      setSelectedQuestion(null);
      setNewOptions(['', '', '', '']);
      setCorrectOption(null);
      toast({
        title: selectedQuestion ? 'Question updated' : 'Question created',
        description: `The question was ${selectedQuestion ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedQuestion ? 'update' : 'create'} question. Please try again.`,
        variant: 'destructive',
      });
    }
  });

  // Mutation for deleting an exam
  const deleteExamMutation = useMutation({
    mutationFn: (examId: number) => {
      return apiRequest(`/api/admin/exams/${examId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      toast({
        title: 'Exam deleted',
        description: 'The exam was deleted successfully.',
      });
    },
    onError: (error) => {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete exam. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Mutation for deleting a question
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => {
      if (!selectedExam) {
        throw new Error('No exam selected');
      }
      return apiRequest(`/api/admin/exams/${selectedExam.id}/questions/${questionId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams', selectedExam?.id, 'questions'] });
      toast({
        title: 'Question deleted',
        description: 'The question was deleted successfully.',
      });
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Form for exams
  const examForm = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: '',
      description: '',
      courseId: courses && courses.length > 0 ? courses[0].id : undefined,
      type: 'quiz' as const,
      duration: 30,
      totalPoints: 100,
      passingPoints: 60,
      isActive: true
    },
    mode: 'onChange' // Add immediate validation
  });

  // Form for questions
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: '',
      type: 'multiple_choice' as const,
      options: [],
      correctAnswer: '',
      points: 10,
      explanation: '',
      order: 1
    }
  });

  // Reset and set form values when selectedExam changes or courses load
  useEffect(() => {
    if (selectedExam) {
      examForm.reset({
        title: selectedExam.title,
        description: selectedExam.description || '',
        courseId: selectedExam.courseId,
        type: selectedExam.type,
        duration: selectedExam.duration,
        totalPoints: selectedExam.totalPoints,
        passingPoints: selectedExam.passingPoints,
        isActive: selectedExam.isActive
      });
    } else {
      examForm.reset({
        title: '',
        description: '',
        courseId: courses && courses.length > 0 ? courses[0].id : undefined,
        type: activeTab === 'quizzes' ? 'quiz' : 'midterm',
        duration: 30,
        totalPoints: 100,
        passingPoints: 60,
        isActive: true
      });
    }
  }, [selectedExam, activeTab, courses]);

  // Reset and set form values when selectedQuestion changes
  useEffect(() => {
    if (selectedQuestion) {
      questionForm.reset({
        question: selectedQuestion.question,
        type: selectedQuestion.type,
        options: selectedQuestion.options || [],
        correctAnswer: selectedQuestion.correctAnswer || '',
        points: selectedQuestion.points,
        explanation: selectedQuestion.explanation || '',
        order: selectedQuestion.order
      });

      if (selectedQuestion.type === 'multiple_choice' && selectedQuestion.options) {
        setNewOptions(selectedQuestion.options);
        const correctIndex = selectedQuestion.options.findIndex(
          option => option === selectedQuestion.correctAnswer
        );
        setCorrectOption(correctIndex >= 0 ? correctIndex : null);
      }
    } else {
      questionForm.reset({
        question: '',
        type: 'multiple_choice',
        options: [],
        correctAnswer: '',
        points: 10,
        explanation: '',
        order: questions.length + 1
      });
      setNewOptions(['', '', '', '']);
      setCorrectOption(null);
    }
  }, [selectedQuestion, questions]);

  // Handle exam form submission
  const onExamSubmit = (values: z.infer<typeof examFormSchema>) => {
    console.log('Submitting form with values:', values);
    
    // Check if we have a valid courseId
    if (!values.courseId || values.courseId < 1) {
      toast({
        title: 'Validation Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }
    
    // Map courseId to course_id for API compatibility and remove frontend-only fields
    const { courseId, totalPoints, passingPoints, duration, isActive, ...rest } = values;
    
    const apiData = {
      ...rest,
      course_id: courseId,
      // Map other fields that might have naming differences 
      max_score: totalPoints,
      passing_score: passingPoints,
      time_limit: duration,
      status: isActive ? 'active' : 'draft'
    };
    
    console.log('Mapped API data:', apiData);
    
    examMutation.mutate(apiData);
  };

  // Handle question form submission
  const onQuestionSubmit = (values: z.infer<typeof questionFormSchema>) => {
    let formData = { ...values };

    if (values.type === 'multiple_choice') {
      // Filter out empty options
      const filteredOptions = newOptions.filter(option => option.trim() !== '');
      
      if (filteredOptions.length < 2) {
        toast({
          title: 'Validation Error',
          description: 'Multiple choice questions must have at least two options.',
          variant: 'destructive',
        });
        return;
      }

      if (correctOption === null) {
        toast({
          title: 'Validation Error',
          description: 'Please select the correct answer.',
          variant: 'destructive',
        });
        return;
      }

      formData.options = filteredOptions;
      formData.correctAnswer = filteredOptions[correctOption];
    } else if (values.type === 'true_false') {
      formData.options = ['True', 'False'];
      formData.correctAnswer = values.correctAnswer;
    } else {
      formData.options = null;
    }

    questionMutation.mutate(formData);
  };

  // Handle adding new exam
  const handleAddExam = () => {
    setSelectedExam(null);
    setIsExamDialogOpen(true);
  };

  // Handle editing an exam
  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsExamDialogOpen(true);
  };

  // Handle deleting an exam
  const handleDeleteExam = (exam: Exam) => {
    if (window.confirm(`Are you sure you want to delete "${exam.title}"?`)) {
      deleteExamMutation.mutate(exam.id);
    }
  };

  // Handle adding new question to an exam
  const handleAddQuestion = (exam: Exam) => {
    setSelectedExam(exam);
    setSelectedQuestion(null);
    setIsQuestionDialogOpen(true);
  };

  // Handle editing a question
  const handleEditQuestion = (question: ExamQuestion) => {
    setSelectedQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  // Handle deleting a question
  const handleDeleteQuestion = (question: ExamQuestion) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(question.id);
    }
  };

  // Handle option change for multiple choice questions
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);
  };

  // Helper to render the question type
  const renderQuestionType = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Quiz & Exam Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddExam}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'quizzes' ? 'Add Quiz' : 'Add Exam'}
          </Button>
        </div>

        <TabsContent value="quizzes" className="space-y-4">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">No quizzes found</p>
                <Button onClick={handleAddExam}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam) => (
              <Card key={exam.id} className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>
                        {exam.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteExam(exam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm">{exam.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Points</p>
                      <p className="text-sm">{exam.totalPoints} (Pass: {exam.passingPoints})</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm">{exam.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Questions</p>
                      <p className="text-sm">
                        {selectedExam?.id === exam.id ? questions.length : '...'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedExam?.id === exam.id && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Questions</h3>
                        <Button size="sm" onClick={() => handleAddQuestion(exam)}>
                          <Plus className="mr-2 h-3 w-3" />
                          Add Question
                        </Button>
                      </div>
                      
                      {questions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No questions added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {questions.map((question, index) => (
                            <Card key={question.id} className="p-4">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">Q{index + 1}: {question.question}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {renderQuestionType(question.type)} • {question.points} points
                                  </p>
                                  
                                  {question.type === 'multiple_choice' && question.options && (
                                    <ul className="mt-2 space-y-1">
                                      {question.options.map((option, idx) => (
                                        <li key={idx} className="text-sm flex items-center">
                                          <span className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                                            {option === question.correctAnswer && '✓ '}
                                            {option}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  
                                  {question.type === 'true_false' && (
                                    <p className="mt-2 text-sm">
                                      Correct answer: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(question)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {selectedExam?.id !== exam.id && (
                    <Button variant="outline" onClick={() => setSelectedExam(exam)}>
                      View Questions
                    </Button>
                  )}
                  {selectedExam?.id === exam.id && (
                    <Button variant="outline" onClick={() => setSelectedExam(null)}>
                      Hide Questions
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="exams" className="space-y-4">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">No exams found</p>
                <Button onClick={handleAddExam}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Same UI as quizzes tab with different data
            exams.map((exam) => (
              <Card key={exam.id} className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{exam.title}</CardTitle>
                      <CardDescription>
                        {exam.description || 'No description provided'} • Type: {exam.type}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteExam(exam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm">{exam.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Points</p>
                      <p className="text-sm">{exam.totalPoints} (Pass: {exam.passingPoints})</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm">{exam.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Questions</p>
                      <p className="text-sm">
                        {selectedExam?.id === exam.id ? questions.length : '...'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedExam?.id === exam.id && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Questions</h3>
                        <Button size="sm" onClick={() => handleAddQuestion(exam)}>
                          <Plus className="mr-2 h-3 w-3" />
                          Add Question
                        </Button>
                      </div>
                      
                      {questions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No questions added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {questions.map((question, index) => (
                            <Card key={question.id} className="p-4">
                              <div className="flex justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">Q{index + 1}: {question.question}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {renderQuestionType(question.type)} • {question.points} points
                                  </p>
                                  
                                  {question.type === 'multiple_choice' && question.options && (
                                    <ul className="mt-2 space-y-1">
                                      {question.options.map((option, idx) => (
                                        <li key={idx} className="text-sm flex items-center">
                                          <span className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                                            {option === question.correctAnswer && '✓ '}
                                            {option}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  
                                  {question.type === 'true_false' && (
                                    <p className="mt-2 text-sm">
                                      Correct answer: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(question)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {selectedExam?.id !== exam.id && (
                    <Button variant="outline" onClick={() => setSelectedExam(exam)}>
                      View Questions
                    </Button>
                  )}
                  {selectedExam?.id === exam.id && (
                    <Button variant="outline" onClick={() => setSelectedExam(null)}>
                      Hide Questions
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Exam Dialog */}
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedExam ? 'Edit' : 'Create'} {activeTab === 'quizzes' ? 'Quiz' : 'Exam'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {selectedExam ? 'update' : 'create'} a new {activeTab === 'quizzes' ? 'quiz' : 'exam'}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...examForm}>
            <form onSubmit={examForm.handleSubmit(onExamSubmit)} className="space-y-4">
              <FormField
                control={examForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                        {...field} 
                        value={field.value || ''} 
                        placeholder="Optional description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={examForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course <span className="text-red-500">*</span></FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        console.log('Selected course value:', value);
                        field.onChange(parseInt(value));
                      }}
                      value={field.value ? field.value.toString() : undefined}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.length === 0 ? (
                          <SelectItem value="none" disabled>No courses available</SelectItem>
                        ) : (
                          <>
                            {courses.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      You must select a course for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Type field is still required by the backend validation */}
              <FormField
                control={examForm.control}
                name="type"
                render={({ field }) => (
                  <input type="hidden" {...field} value={activeTab === 'quizzes' ? 'quiz' : 'midterm'} />
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={examForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={examForm.control}
                  name="totalPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={examForm.control}
                name="passingPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={examForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this {activeTab === 'quizzes' ? 'quiz' : 'exam'} available for students
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={examMutation.isPending}>
                  {examMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedQuestion ? 'Edit' : 'Add'} Question</DialogTitle>
            <DialogDescription>
              {selectedQuestion 
                ? 'Update the question details below.'
                : 'Add a new question to this ' + (activeTab === 'quizzes' ? 'quiz' : 'exam')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'true_false') {
                          setNewOptions(['True', 'False']);
                        } else if (value === 'multiple_choice') {
                          setNewOptions(['', '', '', '']);
                          setCorrectOption(null);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {questionForm.watch('type') === 'multiple_choice' && (
                <div className="space-y-4">
                  <FormLabel>Options</FormLabel>
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={correctOption === index}
                        onChange={() => setCorrectOption(index)}
                        name="correct-option"
                        className="h-4 w-4"
                      />
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewOptions([...newOptions, ''])}
                  >
                    Add Option
                  </Button>
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
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the correct answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="True">True</SelectItem>
                          <SelectItem value="False">False</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(questionForm.watch('type') === 'short_answer') && (
                <FormField
                  control={questionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Enter the expected answer for automated grading.
                      </FormDescription>
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
                      <Input type="number" {...field} />
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
                        {...field} 
                        value={field.value || ''} 
                        placeholder="Provide an explanation for the correct answer" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={questionMutation.isPending}>
                  {questionMutation.isPending ? 'Saving...' : 'Save Question'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}