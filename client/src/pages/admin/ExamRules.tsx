import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define rules schema
const rulesFormSchema = z.object({
  examType: z.string(),
  retakePolicy: z.enum(["no_retake", "one_retake", "unlimited_retakes"]),
  retakeWaitPeriod: z.number().min(0).optional(),
  showResults: z.boolean(),
  showAnswers: z.boolean(),
  proctored: z.boolean(),
  shuffleQuestions: z.boolean(),
  shuffleAnswers: z.boolean(),
  passingThreshold: z.number().min(0).max(100),
  timeLimit: z.number().min(0),
  gracePeriod: z.number().min(0),
  additionalNotes: z.string().optional(),
});

type RulesFormValues = z.infer<typeof rulesFormSchema>;

// Sample rules data for demo
const sampleRules = [
  {
    id: 1,
    examType: "quiz",
    name: "Quiz Rules",
    retakePolicy: "one_retake",
    retakeWaitPeriod: 24,
    showResults: true,
    showAnswers: true,
    proctored: false,
    shuffleQuestions: true,
    shuffleAnswers: true,
    passingThreshold: 60,
    timeLimit: 30,
    gracePeriod: 5,
    additionalNotes: "Default rules for quizzes",
  },
  {
    id: 2,
    examType: "midterm",
    name: "Midterm Exam Rules",
    retakePolicy: "no_retake",
    retakeWaitPeriod: 0,
    showResults: true,
    showAnswers: false,
    proctored: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
    passingThreshold: 70,
    timeLimit: 120,
    gracePeriod: 10,
    additionalNotes: "Strict rules for midterm exams",
  },
  {
    id: 3,
    examType: "final",
    name: "Final Exam Rules",
    retakePolicy: "no_retake",
    retakeWaitPeriod: 0,
    showResults: true,
    showAnswers: false,
    proctored: true,
    shuffleQuestions: false,
    shuffleAnswers: false,
    passingThreshold: 70,
    timeLimit: 180,
    gracePeriod: 15,
    additionalNotes: "Standard rules for final exams",
  },
];

export default function ExamRules() {
  const [rules, setRules] = useState(sampleRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRuleId, setCurrentRuleId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("general");

  // Form setup
  const form = useForm<RulesFormValues>({
    resolver: zodResolver(rulesFormSchema),
    defaultValues: {
      examType: "",
      retakePolicy: "one_retake",
      retakeWaitPeriod: 24,
      showResults: true,
      showAnswers: false,
      proctored: false,
      shuffleQuestions: true,
      shuffleAnswers: true,
      passingThreshold: 60,
      timeLimit: 60,
      gracePeriod: 5,
      additionalNotes: "",
    },
  });

  // Open dialog to edit a rule
  const handleEditRule = (rule: any) => {
    setCurrentRuleId(rule.id);
    form.reset({
      examType: rule.examType,
      retakePolicy: rule.retakePolicy,
      retakeWaitPeriod: rule.retakeWaitPeriod,
      showResults: rule.showResults,
      showAnswers: rule.showAnswers,
      proctored: rule.proctored,
      shuffleQuestions: rule.shuffleQuestions,
      shuffleAnswers: rule.shuffleAnswers,
      passingThreshold: rule.passingThreshold,
      timeLimit: rule.timeLimit,
      gracePeriod: rule.gracePeriod,
      additionalNotes: rule.additionalNotes,
    });
    setIsDialogOpen(true);
  };

  // Open dialog to create a new rule
  const handleAddRule = () => {
    setCurrentRuleId(null);
    form.reset({
      examType: "",
      retakePolicy: "one_retake",
      retakeWaitPeriod: 24,
      showResults: true,
      showAnswers: false,
      proctored: false,
      shuffleQuestions: true,
      shuffleAnswers: true,
      passingThreshold: 60,
      timeLimit: 60,
      gracePeriod: 5,
      additionalNotes: "",
    });
    setIsDialogOpen(true);
  };

  // Open confirmation dialog to delete a rule
  const handleDeleteRule = (id: number) => {
    setCurrentRuleId(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete a rule
  const confirmDeleteRule = () => {
    if (currentRuleId !== null) {
      setRules(rules.filter(rule => rule.id !== currentRuleId));
      setIsDeleteDialogOpen(false);
      setCurrentRuleId(null);
    }
  };

  // Handle form submission
  const onSubmit = (values: RulesFormValues) => {
    if (currentRuleId === null) {
      // Add new rule
      const newRule = {
        id: rules.length + 1,
        name: `${values.examType.charAt(0).toUpperCase() + values.examType.slice(1)} Rules`,
        ...values,
      };
      setRules([...rules, newRule]);
    } else {
      // Update existing rule
      setRules(
        rules.map(rule =>
          rule.id === currentRuleId
            ? {
                ...rule,
                ...values,
                name: `${values.examType.charAt(0).toUpperCase() + values.examType.slice(1)} Rules`,
              }
            : rule
        )
      );
    }
    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Rules</h1>
            <p className="text-muted-foreground">
              Manage rules and policies for different types of exams.
            </p>
          </div>
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 h-4 w-4" /> Add Rule Set
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map(rule => (
            <Card key={rule.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge className="mt-1">{rule.examType}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retake Policy:</span>
                    <span className="font-medium">
                      {rule.retakePolicy === "no_retake"
                        ? "No Retakes"
                        : rule.retakePolicy === "one_retake"
                        ? "One Retake"
                        : "Unlimited Retakes"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passing Threshold:</span>
                    <span className="font-medium">{rule.passingThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Limit:</span>
                    <span className="font-medium">{rule.timeLimit} mins</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.proctored ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'} border`}>
                        {rule.proctored && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className="text-xs">Proctored</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.showResults ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'} border`}>
                        {rule.showResults && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className="text-xs">Show Results</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.showAnswers ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'} border`}>
                        {rule.showAnswers && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className="text-xs">Show Answers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.shuffleQuestions ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'} border`}>
                        {rule.shuffleQuestions && <Check className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className="text-xs">Shuffle Questions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Edit Rule Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentRuleId ? "Edit Rule Set" : "Create Rule Set"}</DialogTitle>
              <DialogDescription>
                Configure rules and policies for a specific exam type.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="time">Time Settings</TabsTrigger>
                    <TabsTrigger value="security">Security & Display</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="examType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an exam type" />
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
                          <FormDescription>
                            These rules will apply to all exams of this type.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Threshold (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum percentage required to pass the exam.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="retakePolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retake Policy</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no_retake" id="no_retake" />
                                <Label htmlFor="no_retake">No retakes allowed</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="one_retake" id="one_retake" />
                                <Label htmlFor="one_retake">One retake allowed</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="unlimited_retakes" id="unlimited_retakes" />
                                <Label htmlFor="unlimited_retakes">Unlimited retakes allowed</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("retakePolicy") !== "no_retake" && (
                      <FormField
                        control={form.control}
                        name="retakeWaitPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retake Wait Period (hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Hours a student must wait before retaking the exam. Set to 0 for no waiting period.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional notes or special instructions..."
                              className="min-h-[100px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="time" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum time allowed for the exam. Set to 0 for no time limit.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gracePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grace Period (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional time granted after the time limit expires.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="proctored"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Proctored Exam</FormLabel>
                            <FormDescription>
                              Requires supervision or online proctoring.
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
                      name="shuffleQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Shuffle Questions</FormLabel>
                            <FormDescription>
                              Randomize the order of questions for each student.
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
                      name="shuffleAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Shuffle Answers</FormLabel>
                            <FormDescription>
                              Randomize the order of multiple-choice answers.
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
                      name="showResults"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Results</FormLabel>
                            <FormDescription>
                              Allow students to see their score after submission.
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
                      name="showAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Correct Answers</FormLabel>
                            <FormDescription>
                              Allow students to see the correct answers after submission.
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
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button type="submit">{currentRuleId ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this rule set. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRule} className="bg-red-600 text-white hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}