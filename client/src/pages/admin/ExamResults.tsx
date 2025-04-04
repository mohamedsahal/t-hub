import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Download, Eye, Filter, Search, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Filter form schema
const filterFormSchema = z.object({
  examId: z.string().optional(),
  courseId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

// Sample data for demonstrating the interface
const sampleExamResults = [
  {
    id: 1,
    examId: 1,
    examTitle: "Introduction to JavaScript - Final Exam",
    courseId: 1,
    courseTitle: "Frontend Web Development",
    studentId: 101,
    studentName: "John Doe",
    score: 87,
    grade: "B",
    status: "completed",
    submittedAt: "2025-04-01T14:30:00",
    gradedBy: "Sarah Wilson",
    remarks: "Good understanding of core concepts. Improve on asynchronous JavaScript.",
  },
  {
    id: 2,
    examId: 1,
    examTitle: "Introduction to JavaScript - Final Exam",
    courseId: 1,
    courseTitle: "Frontend Web Development",
    studentId: 102,
    studentName: "Jane Smith",
    score: 94,
    grade: "A",
    status: "completed",
    submittedAt: "2025-04-01T15:20:00",
    gradedBy: "Sarah Wilson",
    remarks: "Excellent work! Great understanding of advanced concepts.",
  },
  {
    id: 3,
    examId: 2,
    examTitle: "Midterm Assessment",
    courseId: 2,
    courseTitle: "UX Design Principles",
    studentId: 103,
    studentName: "Michael Johnson",
    score: 72,
    grade: "C",
    status: "completed",
    submittedAt: "2025-04-02T10:15:00",
    gradedBy: "Robert Chen",
    remarks: "Needs improvement in understanding user research methods.",
  },
  {
    id: 4,
    examId: 3,
    examTitle: "Database Design Quiz",
    courseId: 3,
    courseTitle: "Backend Database Systems",
    studentId: 101,
    studentName: "John Doe",
    score: 0,
    grade: "incomplete",
    status: "in_progress",
    submittedAt: null,
    gradedBy: null,
    remarks: null,
  },
];

// Sample exams for dropdown
const sampleExams = [
  { id: 1, title: "Introduction to JavaScript - Final Exam" },
  { id: 2, title: "Midterm Assessment" },
  { id: 3, title: "Database Design Quiz" },
];

// Sample courses for dropdown
const sampleCourses = [
  { id: 1, title: "Frontend Web Development" },
  { id: 2, title: "UX Design Principles" },
  { id: 3, title: "Backend Database Systems" },
];

// Sample students for dropdown
const sampleStudents = [
  { id: 101, name: "John Doe" },
  { id: 102, name: "Jane Smith" },
  { id: 103, name: "Michael Johnson" },
];

export default function ExamResults() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [filteredResults, setFilteredResults] = useState(sampleExamResults);

  // Setup filter form
  const filterForm = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      examId: "",
      courseId: "",
      studentId: "",
      status: "",
    },
  });

  // Handle viewing result details
  const handleViewDetails = (result: any) => {
    setSelectedResult(result);
    setIsViewDetailsOpen(true);
  };

  // Handle searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      setFilteredResults(sampleExamResults);
      return;
    }
    
    const filtered = sampleExamResults.filter(
      result =>
        result.examTitle.toLowerCase().includes(query) ||
        result.courseTitle.toLowerCase().includes(query) ||
        result.studentName.toLowerCase().includes(query) ||
        result.grade.toLowerCase().includes(query)
    );
    
    setFilteredResults(filtered);
  };

  // Handle filter submission
  const applyFilters = (values: FilterFormValues) => {
    let filtered = [...sampleExamResults];

    if (values.examId) {
      filtered = filtered.filter(result => result.examId === parseInt(values.examId));
    }

    if (values.courseId) {
      filtered = filtered.filter(result => result.courseId === parseInt(values.courseId));
    }

    if (values.studentId) {
      filtered = filtered.filter(result => result.studentId === parseInt(values.studentId));
    }

    if (values.status) {
      filtered = filtered.filter(result => result.status === values.status);
    }

    if (values.fromDate) {
      filtered = filtered.filter(result => {
        if (!result.submittedAt) return false;
        const submittedDate = new Date(result.submittedAt);
        return submittedDate >= values.fromDate!;
      });
    }

    if (values.toDate) {
      filtered = filtered.filter(result => {
        if (!result.submittedAt) return false;
        const submittedDate = new Date(result.submittedAt);
        return submittedDate <= values.toDate!;
      });
    }

    setFilteredResults(filtered);
    setIsFilterOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    filterForm.reset({
      examId: "",
      courseId: "",
      studentId: "",
      status: "",
      fromDate: undefined,
      toDate: undefined,
    });
    setFilteredResults(sampleExamResults);
    setIsFilterOpen(false);
  };

  // Export results
  const handleExport = () => {
    // In a real application, this would generate and download a CSV or Excel file
    console.log("Exporting results:", filteredResults);
    alert("Exporting exam results as CSV file...");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
            <p className="text-muted-foreground">
              View and manage student exam results and grades.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search results..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="ml-4">
            <Badge variant="outline">
              {filteredResults.length} {filteredResults.length === 1 ? "Result" : "Results"}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No exam results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{result.studentName}</div>
                              <div className="text-xs text-muted-foreground">ID: {result.studentId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{result.examTitle}</TableCell>
                        <TableCell>{result.courseTitle}</TableCell>
                        <TableCell className="text-center">
                          {result.status === "completed" ? result.score : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.status === "completed" ? (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-semibold",
                                result.grade === "A" ? "bg-green-50 text-green-700 border-green-200" :
                                result.grade === "B" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                result.grade === "C" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                result.grade === "D" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                result.grade === "F" ? "bg-red-50 text-red-700 border-red-200" :
                                ""
                              )}
                            >
                              {result.grade}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={result.status === "completed" ? "default" : 
                                  result.status === "in_progress" ? "secondary" : "outline"}
                          >
                            {result.status === "completed" ? "Completed" : 
                            result.status === "in_progress" ? "In Progress" : "Not Started"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.submittedAt ? (
                            <div className="text-sm">
                              {format(new Date(result.submittedAt), "MMM d, yyyy")}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(result.submittedAt), "h:mm a")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not submitted</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewDetails(result)}
                            disabled={result.status !== "completed"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Exam Results</DialogTitle>
            <DialogDescription>
              Set filters to narrow down the exam results.
            </DialogDescription>
          </DialogHeader>
          <Form {...filterForm}>
            <form onSubmit={filterForm.handleSubmit(applyFilters)} className="space-y-4">
              <FormField
                control={filterForm.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Exams</SelectItem>
                        {sampleExams.map(exam => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            {exam.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={filterForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Courses</SelectItem>
                        {sampleCourses.map(course => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={filterForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Students</SelectItem>
                        {sampleStudents.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={filterForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="not_started">Not Started</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={filterForm.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                <FormField
                  control={filterForm.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
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
                              filterForm.getValues("fromDate") &&
                              date < filterForm.getValues("fromDate")!
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button type="submit">Apply Filters</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Result Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Exam Result Details</DialogTitle>
            <DialogDescription>
              Detailed information about the student's exam result.
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Student</h4>
                  <p className="font-semibold">{selectedResult.studentName}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedResult.studentId}</p>
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Exam</h4>
                  <p className="font-semibold">{selectedResult.examTitle}</p>
                  <p className="text-sm text-muted-foreground">{selectedResult.courseTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-md p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Score</h4>
                  <p className="text-3xl font-bold">{selectedResult.score}</p>
                </div>
                <div className="bg-muted rounded-md p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Grade</h4>
                  <p className="text-3xl font-bold">{selectedResult.grade}</p>
                </div>
                <div className="bg-muted rounded-md p-4 text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge className="mt-1">{selectedResult.status}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-muted-foreground mb-2">Grading Details</h4>
                <div className="bg-muted rounded-md p-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium">Graded by:</span>{" "}
                    <span>{selectedResult.gradedBy || "N/A"}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-medium">Submitted on:</span>{" "}
                    <span>
                      {selectedResult.submittedAt 
                        ? format(new Date(selectedResult.submittedAt), "PPP 'at' h:mm a") 
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block mb-1">Remarks:</span>
                    <p className="text-sm">{selectedResult.remarks || "No remarks provided."}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}