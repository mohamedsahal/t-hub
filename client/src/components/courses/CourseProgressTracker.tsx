import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, Clock, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseProgressTrackerProps {
  courseId: number;
  courseTitle: string;
}

interface CourseSection {
  id: number;
  title: string;
  type: string;
  moduleId: number;
  moduleTitle?: string;
  duration?: number;
  content?: string;
  videoUrl?: string;
  order: number;
}

interface ProgressRecord {
  id: number;
  userId: number;
  courseId: number;
  sectionId: number;
  isCompleted: boolean;
  completionDate: string | null;
  timeSpent: number;
  lastPosition: number;
  notes: string | null;
}

interface ProgressData {
  progressRecords: ProgressRecord[];
  completionPercentage: number;
}

export default function CourseProgressTracker({ courseId, courseTitle }: CourseProgressTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState<CourseSection | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoTimeSpent, setVideoTimeSpent] = useState(0);
  const [videoTimerActive, setVideoTimerActive] = useState(false);
  
  // Fetch course sections
  const { 
    data: sections, 
    isLoading: sectionsLoading 
  } = useQuery({
    queryKey: ['/api/course-sections', courseId],
    queryFn: () => apiRequest(`/api/course-sections?courseId=${courseId}`),
  });
  
  // Fetch user progress for this course
  const { 
    data: progress, 
    isLoading: progressLoading
  } = useQuery<ProgressData>({
    queryKey: ['/api/user-progress', courseId],
    queryFn: () => apiRequest(`/api/user-progress/${courseId}`),
  });
  
  // Mutation to mark a section as completed
  const markSectionCompletedMutation = useMutation({
    mutationFn: (sectionId: number) => 
      apiRequest('/api/user-progress/complete-section', {
        method: 'POST',
        data: { courseId, sectionId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress', courseId] });
      toast({
        title: 'Progress updated',
        description: 'Section marked as completed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive',
      });
    }
  });
  
  // Mutation to update video progress
  const updateVideoProgressMutation = useMutation({
    mutationFn: ({ sectionId, lastPosition, timeSpent }: { sectionId: number, lastPosition: number, timeSpent: number }) => 
      apiRequest('/api/user-progress/update-video', {
        method: 'POST',
        data: { courseId, sectionId, lastPosition, timeSpent }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress', courseId] });
    },
    onError: (error) => {
      console.error('Failed to update video progress:', error);
    }
  });
  
  // Start/resume timer for tracking video time spent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (videoTimerActive && currentSection) {
      interval = setInterval(() => {
        setVideoTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [videoTimerActive, currentSection]);
  
  // Save video progress regularly (every 30 seconds)
  useEffect(() => {
    let saveInterval: NodeJS.Timeout;
    
    if (videoTimerActive && currentSection && videoTimeSpent > 0 && videoTimeSpent % 30 === 0) {
      updateVideoProgressMutation.mutate({
        sectionId: currentSection.id,
        lastPosition: videoProgress,
        timeSpent: 30 // We send 30 seconds as the time spent since last update
      });
    }
    
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [videoTimeSpent, videoTimerActive, currentSection, videoProgress]);
  
  // Save progress when user stops watching
  const handleStopWatching = () => {
    if (currentSection && videoTimerActive) {
      setVideoTimerActive(false);
      
      // Only update if there's actual time spent
      if (videoTimeSpent > 0) {
        updateVideoProgressMutation.mutate({
          sectionId: currentSection.id,
          lastPosition: videoProgress,
          timeSpent: videoTimeSpent
        });
      }
      
      setVideoTimeSpent(0);
    }
  };
  
  // Function to start watching a section
  const handleStartSection = (section: CourseSection) => {
    setCurrentSection(section);
    setVideoProgress(0);
    setVideoTimeSpent(0);
    setVideoTimerActive(true);
    
    // If this is a video section, we simulate starting the video
    if (section.videoUrl) {
      toast({
        title: 'Video started',
        description: `Now playing: ${section.title}`,
      });
    }
  };
  
  // Function to manually mark a section as completed
  const handleMarkCompleted = (sectionId: number) => {
    markSectionCompletedMutation.mutate(sectionId);
  };
  
  // Helper function to format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Determine if a section is completed
  const isSectionCompleted = (sectionId: number): boolean => {
    if (!progress) return false;
    
    return progress.progressRecords.some(
      record => record.sectionId === sectionId && record.isCompleted
    );
  };
  
  // Get time spent on a section
  const getSectionTimeSpent = (sectionId: number): number => {
    if (!progress) return 0;
    
    const record = progress.progressRecords.find(r => r.sectionId === sectionId);
    return record ? record.timeSpent : 0;
  };
  
  if (sectionsLoading || progressLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Course Progress: {courseTitle}</CardTitle>
        <CardDescription>
          {progress && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span>Overall Progress</span>
                <span>{Math.round(progress.completionPercentage)}%</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-2" />
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections?.map((section: CourseSection) => {
            const completed = isSectionCompleted(section.id);
            const timeSpent = getSectionTimeSpent(section.id);
            
            return (
              <div 
                key={section.id} 
                className={`p-4 border rounded-md ${completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {completed ? (
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    ) : (
                      section.videoUrl ? (
                        <PlayCircle className="h-6 w-6 text-blue-500 mt-0.5" />
                      ) : (
                        <Clock className="h-6 w-6 text-orange-500 mt-0.5" />
                      )
                    )}
                    
                    <div>
                      <h3 className="font-medium">{section.title}</h3>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                        {section.moduleTitle && (
                          <Badge variant="outline" className="mr-2">
                            Module: {section.moduleTitle}
                          </Badge>
                        )}
                        {section.type && (
                          <Badge variant="secondary" className="mr-2">
                            {section.type === 'lesson' ? 'Lesson' : 'Exam'}
                          </Badge>
                        )}
                        {timeSpent > 0 && (
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            Time spent: {formatTime(timeSpent)}
                          </span>
                        )}
                        {completed && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!completed && (
                      <>
                        {currentSection?.id === section.id && videoTimerActive ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleStopWatching}
                          >
                            Stop
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStartSection(section)}
                          >
                            {section.videoUrl ? 'Watch Video' : 'Start'}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkCompleted(section.id)}
                        >
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Video Progress UI (shown only for active video sections) */}
                {currentSection?.id === section.id && videoTimerActive && section.videoUrl && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Video Progress: {videoProgress}%</span>
                      <span>Time: {formatTime(videoTimeSpent)}</span>
                    </div>
                    <Progress value={videoProgress} className="h-1.5" />
                    <div className="flex justify-between mt-4">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setVideoProgress(Math.min(videoProgress + 10, 100))}
                      >
                        Skip Forward
                      </Button>
                      {videoProgress >= 95 && (
                        <Button 
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            handleStopWatching();
                            handleMarkCompleted(section.id);
                          }}
                        >
                          Complete Video
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        {progress && progress.completionPercentage === 100 && (
          <div className="flex items-center gap-2 text-green-600">
            <Award className="h-5 w-5" />
            <span className="font-medium">Course Completed!</span>
          </div>
        )}
        <div className="ml-auto">
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh Progress</Button>
        </div>
      </CardFooter>
    </Card>
  );
}