import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';

// Define types for the API response
interface CourseSection {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  moduleId: number | null;
  order: number;
  videoUrl: string | null;
  contentUrl: string | null;
  content: string | null;
  contentType: 'text' | 'video' | 'mixed' | null;
  type: 'lesson' | 'exam' | 'quiz' | 'assignment';
  isPublished: boolean;
  completed?: boolean;
}

interface CourseModule {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  order: number;
  sections: CourseSection[];
}

interface CourseContentResponse {
  modules: CourseModule[];
  sections: CourseSection[]; // Sections not belonging to any module
}

interface CourseProgressRecord {
  id: number;
  courseId: number;
  sectionId: number;
  completed: boolean;
  completionDate: string | null;
  lastPosition: number | null;
  timeSpent: number | null;
}

interface CourseProgress {
  progressRecords: CourseProgressRecord[];
  completionPercentage: number;
}

interface CourseContentViewProps {
  courseId: number;
  userId: number;
}

const CourseContentView: React.FC<CourseContentViewProps> = ({ courseId, userId }) => {
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch course content (modules and sections)
  const { data: courseContent, isLoading: isContentLoading } = useQuery<CourseContentResponse>({
    queryKey: ['/api/course-sections', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/course-sections?courseId=${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course content');
      return response.json();
    }
  });

  // Fetch user progress for this course
  const { data: progressData, isLoading: isProgressLoading } = useQuery<CourseProgress>({
    queryKey: ['/api/user-progress', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/user-progress/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch progress data');
      return response.json();
    },
    enabled: !!userId // Only fetch if we have a userId
  });

  // Set the first section as selected when data loads
  useEffect(() => {
    if (courseContent && !selectedSection) {
      // Try to find a section that's not completed yet
      if (progressData?.progressRecords) {
        const completedSectionIds = new Set(
          progressData.progressRecords
            .filter(record => record.completed)
            .map(record => record.sectionId)
        );

        // First check modules
        for (const module of courseContent.modules) {
          for (const section of module.sections) {
            if (!completedSectionIds.has(section.id)) {
              setSelectedSection(section);
              return;
            }
          }
        }

        // Then check standalone sections
        for (const section of courseContent.sections) {
          if (!completedSectionIds.has(section.id)) {
            setSelectedSection(section);
            return;
          }
        }
      }

      // If all sections are completed or no progress data, just pick the first one
      if (courseContent.modules.length > 0 && courseContent.modules[0].sections.length > 0) {
        setSelectedSection(courseContent.modules[0].sections[0]);
      } else if (courseContent.sections.length > 0) {
        setSelectedSection(courseContent.sections[0]);
      }
    }
  }, [courseContent, selectedSection, progressData]);

  // Mark a section as completed
  const markSectionCompleted = async (sectionId: number) => {
    try {
      const response = await fetch('/api/user-progress/complete-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          sectionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark section as completed');
      }

      // Show success toast
      toast({
        title: "Progress Saved",
        description: "Your progress has been saved successfully.",
      });
    } catch (error) {
      console.error('Error marking section as completed:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if a section is completed
  const isSectionCompleted = (sectionId: number): boolean => {
    if (!progressData?.progressRecords) return false;
    return progressData.progressRecords.some(
      record => record.sectionId === sectionId && record.completed
    );
  };

  if (isContentLoading || isProgressLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        <div className="md:col-span-1 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="md:col-span-3 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (!courseContent) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Content Not Available</CardTitle>
            <CardDescription>
              The course content could not be loaded. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {/* Sidebar with modules and sections */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>
              {progressData?.completionPercentage ? (
                <span>{Math.round(progressData.completionPercentage)}% Complete</span>
              ) : (
                <span>0% Complete</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto">
            {/* Modules with their sections */}
            {courseContent.modules.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                {courseContent.modules.map((module) => (
                  <AccordionItem key={module.id} value={`module-${module.id}`}>
                    <AccordionTrigger className="text-left">
                      {module.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {module.sections.map((section) => {
                          const completed = isSectionCompleted(section.id);
                          return (
                            <div
                              key={section.id}
                              className={`flex items-center p-2 rounded-md cursor-pointer ${
                                selectedSection?.id === section.id
                                  ? 'bg-primary/10'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setSelectedSection(section)}
                            >
                              {completed ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              ) : section.contentType === 'video' ? (
                                <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                              )}
                              <span className="text-sm">{section.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {/* Standalone sections (not in modules) */}
            {courseContent.sections.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium mb-2">Additional Content</h3>
                {courseContent.sections.map((section) => {
                  const completed = isSectionCompleted(section.id);
                  return (
                    <div
                      key={section.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedSection?.id === section.id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedSection(section)}
                    >
                      {completed ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      ) : section.contentType === 'video' ? (
                        <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      )}
                      <span className="text-sm">{section.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <div className="md:col-span-3">
        {selectedSection ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedSection.title}</CardTitle>
                  {selectedSection.description && (
                    <CardDescription>{selectedSection.description}</CardDescription>
                  )}
                </div>
                <Button
                  onClick={() => markSectionCompleted(selectedSection.id)}
                  disabled={isSectionCompleted(selectedSection.id)}
                  variant={isSectionCompleted(selectedSection.id) ? "outline" : "default"}
                >
                  {isSectionCompleted(selectedSection.id) ? "Completed" : "Mark as Completed"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedSection.contentType === 'video' && selectedSection.videoUrl ? (
                <div className="aspect-video mb-4">
                  <YouTubeVideoPlayer
                    videoUrl={selectedSection.videoUrl}
                    courseId={courseId}
                    sectionId={selectedSection.id}
                  />
                </div>
              ) : null}

              {selectedSection.content && (
                <div className="prose max-w-none dark:prose-invert mt-4">
                  <div dangerouslySetInnerHTML={{ __html: selectedSection.content }} />
                </div>
              )}

              {selectedSection.contentUrl && (
                <div className="mt-4">
                  <a
                    href={selectedSection.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Additional Resources
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}

              {/* Navigation between sections */}
              <div className="mt-8 pt-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Find previous section
                    const allSections = [
                      ...courseContent.modules.flatMap(m => m.sections),
                      ...courseContent.sections
                    ].sort((a, b) => a.order - b.order);
                    
                    const currentIndex = allSections.findIndex(s => s.id === selectedSection.id);
                    if (currentIndex > 0) {
                      setSelectedSection(allSections[currentIndex - 1]);
                    }
                  }}
                  disabled={
                    // Check if this is the first section
                    ![
                      ...courseContent.modules.flatMap(m => m.sections),
                      ...courseContent.sections
                    ].sort((a, b) => a.order - b.order).findIndex(s => s.id === selectedSection.id)
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Find next section
                    const allSections = [
                      ...courseContent.modules.flatMap(m => m.sections),
                      ...courseContent.sections
                    ].sort((a, b) => a.order - b.order);
                    
                    const currentIndex = allSections.findIndex(s => s.id === selectedSection.id);
                    if (currentIndex < allSections.length - 1) {
                      setSelectedSection(allSections[currentIndex + 1]);
                    }
                  }}
                  disabled={
                    // Check if this is the last section
                    [
                      ...courseContent.modules.flatMap(m => m.sections),
                      ...courseContent.sections
                    ].sort((a, b) => a.order - b.order).findIndex(s => s.id === selectedSection.id) === 
                    [
                      ...courseContent.modules.flatMap(m => m.sections),
                      ...courseContent.sections
                    ].length - 1
                  }
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Select a section</CardTitle>
              <CardDescription>
                Please select a section from the sidebar to view its content.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseContentView;