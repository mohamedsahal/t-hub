import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Exam {
  id: number;
  title: string;
  description: string | null;
  type: string;
  courseId: number;
  status: string;
  maxScore: number;
  gradingMode: string;
}

interface ExamSelectorProps {
  courseId: number;
  onExamSelect: (exam: Exam | null) => void;
  selectedExamId?: number | null;
  placeholder?: string;
  showCreateOption?: boolean;
  onCreateExam?: () => void;
  className?: string;
  disabled?: boolean;
  showOnlyCourseExams?: boolean;
}

export default function ExamSelector({
  courseId,
  onExamSelect,
  selectedExamId = null,
  placeholder = "Select an exam",
  showCreateOption = true,
  onCreateExam,
  className,
  disabled = false,
  showOnlyCourseExams = false,
}: ExamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showAllExams, setShowAllExams] = useState(!showOnlyCourseExams);

  // Fetch all exams
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['/api/admin/exams', { courseId: showAllExams ? undefined : courseId }],
    queryFn: async () => {
      try {
        if (showAllExams) {
          // Fetch all exams if showAllExams is true
          const response = await apiRequest('/api/admin/exams');
          return response;
        } else {
          // Otherwise fetch only exams for this course
          const response = await apiRequest(`/api/admin/exams?courseId=${courseId}`);
          return response;
        }
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        return [];
      }
    },
    enabled: !!courseId
  });

  // Filtered exams based on search query
  const filteredExams = exams
    ? exams.filter((exam: Exam) => 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // If a selectedExamId is provided, find and set the selectedExam
  useEffect(() => {
    if (selectedExamId && exams.length > 0) {
      const exam = exams.find((e: Exam) => e.id === selectedExamId);
      if (exam) {
        setSelectedExam(exam);
      }
    } else if (selectedExamId === null) {
      setSelectedExam(null);
    }
  }, [selectedExamId, exams]);

  // Handle selecting an exam
  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    onExamSelect(exam);
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden"
            disabled={disabled}
          >
            {selectedExam ? (
              <div className="flex items-center truncate">
                <span className="truncate">{selectedExam.title}</span>
                <Badge className="ml-2" variant={selectedExam.type === 'final' ? 'destructive' : 'default'}>
                  {selectedExam.type}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Loading exams...</span>
            </div>
          ) : (
            <Command>
              <CommandInput 
                placeholder="Search exams..." 
                onValueChange={setSearchQuery} 
                value={searchQuery}
              />
              
              {!showOnlyCourseExams && (
                <div className="px-3 py-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-all-exams" 
                      checked={showAllExams}
                      onCheckedChange={(checked) => setShowAllExams(checked as boolean)}
                    />
                    <label 
                      htmlFor="show-all-exams"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Show exams from all courses
                    </label>
                  </div>
                </div>
              )}
              
              <CommandList>
                <CommandEmpty>
                  <div className="px-4 py-3 text-center">
                    {showCreateOption ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">No exams found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setOpen(false);
                            onCreateExam && onCreateExam();
                          }}
                        >
                          Create New Exam
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No exams found</p>
                    )}
                  </div>
                </CommandEmpty>
                
                <CommandGroup heading="Exams">
                  {filteredExams.map((exam: Exam) => {
                    const isCourseExam = exam.courseId === courseId;
                    
                    return (
                      <CommandItem
                        key={exam.id}
                        value={`${exam.id}-${exam.title}`}
                        onSelect={() => handleSelectExam(exam)}
                        className={cn("flex items-center justify-between", 
                          !isCourseExam && "opacity-70 hover:opacity-100"
                        )}
                      >
                        <div className="flex-1 truncate">
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {exam.description || "No description"}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!isCourseExam && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <Badge variant={exam.type === 'final' ? 'destructive' : 'default'}>
                            {exam.type}
                          </Badge>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                
                {showCreateOption && (
                  <div className="px-4 py-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        onCreateExam && onCreateExam();
                      }}
                    >
                      Create New Exam
                    </Button>
                  </div>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
      
      {selectedExam && selectedExam.courseId !== courseId && (
        <Alert className="mt-2 border-yellow-500 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>External Exam</AlertTitle>
          <AlertDescription className="text-xs">
            This exam belongs to another course. Students will need access to both courses.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}