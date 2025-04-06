import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Exam {
  id: number;
  title: string;
  description: string | null;
  type: string;
  max_score: number;
  passing_score: number;
  time_limit: number;
  status: string;
  grading_mode: string;
  // Other fields...
}

interface ExamQuestionFormProps {
  questionForm: UseFormReturn<any>;
  currentExam?: Exam;
}

export const ExamQuestionForm: React.FC<ExamQuestionFormProps> = ({
  questionForm,
  currentExam,
}) => {
  if (currentExam?.grading_mode === 'auto') {
    return (
      <>
        {/* AUTO-GRADED EXAM QUESTIONS */}
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
                  
                  // Reset options if changing from multiple choice
                  if (value !== 'multiple_choice') {
                    questionForm.setValue('options', []);
                  } else if (!questionForm.watch('options')?.length) {
                    questionForm.setValue('options', ['', '']);
                  }
                  
                  // Set default for true/false
                  if (value === 'true_false' && !questionForm.watch('correctAnswer')) {
                    questionForm.setValue('correctAnswer', 'true');
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
                  {/* Only auto-gradable question types for auto-graded exams */}
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
            {questionForm.watch('options')?.map((option, index) => (
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
        
        <FormField
          control={questionForm.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  } else {
    // Manual grading mode
    return (
      <>
        {/* MANUAL-GRADED EXAM QUESTIONS */}
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
                  
                  // Reset options if changing from multiple choice
                  if (value !== 'multiple_choice') {
                    questionForm.setValue('options', []);
                  } else if (!questionForm.watch('options')?.length) {
                    questionForm.setValue('options', ['', '']);
                  }
                  
                  // For manual grading, we don't need correct answers
                  questionForm.setValue('correctAnswer', '');
                  // For manual grading, we don't assign points here
                  questionForm.setValue('points', 0);
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
            <FormDescription>
              Add multiple choice options below. Answers will be evaluated manually during grading.
            </FormDescription>
            {questionForm.watch('options')?.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={questionForm.watch(`options.${index}`) || ''}
                  onChange={(e) => {
                    const newOptions = [...(questionForm.watch('options') || [])];
                    newOptions[index] = e.target.value;
                    questionForm.setValue('options', newOptions);
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Manual Grading</AlertTitle>
          <AlertDescription>
            Points and correct answers will be assigned during manual grading.
          </AlertDescription>
        </Alert>
      </>
    );
  }
};

export default ExamQuestionForm;