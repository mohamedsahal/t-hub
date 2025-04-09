import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { PlayCircle, PauseCircle, RotateCw, CheckCircle, Loader2 } from 'lucide-react';

interface YouTubeVideoPlayerProps {
  videoId: string;
  courseId: number;
  sectionId: number;
  title: string;
  isCompleted?: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function YouTubeVideoPlayer({ 
  videoId, 
  courseId, 
  sectionId, 
  title,
  isCompleted = false 
}: YouTubeVideoPlayerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loadingYouTubeApi, setLoadingYouTubeApi] = useState(true);
  const [isVideoCompleted, setIsVideoCompleted] = useState(isCompleted);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  
  // Interval refs for tracking time and progress
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mutation to update video progress
  const updateProgressMutation = useMutation({
    mutationFn: (data: { lastPosition: number, timeSpent: number }) =>
      apiRequest('/api/user-progress/update-video', {
        method: 'POST',
        data: {
          courseId,
          sectionId,
          lastPosition: data.lastPosition,
          timeSpent: data.timeSpent
        }
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress', courseId] });
      
      // If the video is now marked as completed
      if (data.progress.isCompleted && !isVideoCompleted) {
        setIsVideoCompleted(true);
        toast({
          title: "Video completed",
          description: "Your progress has been saved.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your video progress.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to manually mark video as complete
  const markCompleteManually = useMutation({
    mutationFn: () =>
      apiRequest('/api/user-progress/complete-section', {
        method: 'POST',
        data: {
          courseId,
          sectionId,
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress', courseId] });
      setIsVideoCompleted(true);
      toast({
        title: "Marked as complete",
        description: "This video has been marked as completed.",
      });
    }
  });
  
  // Load the YouTube IFrame API
  useEffect(() => {
    // Only load if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        setLoadingYouTubeApi(false);
        initPlayer();
      };
    } else {
      setLoadingYouTubeApi(false);
      initPlayer();
    }
    
    return () => {
      // Cleanup
      cleanupIntervals();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);
  
  // Initialize the YouTube Player
  const initPlayer = () => {
    if (window.YT && window.YT.Player && playerContainerRef.current) {
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        }
      });
    }
  };
  
  // Handle player ready event
  const onPlayerReady = (event: any) => {
    setPlayerReady(true);
    setDuration(event.target.getDuration());
  };
  
  // Handle player state changes
  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    // YT.PlayerState.PLAYING = 1
    if (playerState === 1) {
      setIsPlaying(true);
      if (!hasStartedPlaying) {
        setHasStartedPlaying(true);
      }
      startProgressTracking();
    } 
    // YT.PlayerState.PAUSED = 2
    else if (playerState === 2) {
      setIsPlaying(false);
      stopProgressTracking();
      saveProgress();
    }
    // YT.PlayerState.ENDED = 0 
    else if (playerState === 0) {
      setIsPlaying(false);
      stopProgressTracking();
      setProgress(100);
      
      // Save final progress and mark as completed
      saveProgress(true);
    }
  };
  
  // Start tracking video progress
  const startProgressTracking = () => {
    // Clear any existing intervals to avoid duplicates
    cleanupIntervals();
    
    // Update time tracking
    setLastUpdateTime(Date.now());
    
    // Set up progress tracking interval (runs every second)
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const videoDuration = playerRef.current.getDuration();
        const progressPercent = (currentTime / videoDuration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(Math.min(Math.round(progressPercent), 100));
        
        // Track time spent
        const now = Date.now();
        const timeDiff = Math.floor((now - lastUpdateTime) / 1000);
        setTimeSpent(prev => prev + timeDiff);
        setLastUpdateTime(now);
      }
    }, 1000);
    
    // Set up save interval (every 30 seconds)
    saveIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds
  };
  
  // Stop tracking video progress
  const stopProgressTracking = () => {
    cleanupIntervals();
  };
  
  // Cleanup intervals
  const cleanupIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  };
  
  // Save progress to the server
  const saveProgress = (forceComplete = false) => {
    if (hasStartedPlaying && (timeSpent > 0 || forceComplete)) {
      // Calculate the progress percentage based on current position
      let progressPercent = progress;
      
      // If we're forcing completion, set progress to 100%
      if (forceComplete) {
        progressPercent = 100;
      }
      
      updateProgressMutation.mutate({
        lastPosition: progressPercent,
        timeSpent: timeSpent
      });
      
      // Reset time spent after saving
      setTimeSpent(0);
    }
  };
  
  // Play/pause the video
  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };
  
  // Restart the video
  const restartVideo = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    }
  };
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Mark video as complete manually
  const handleMarkComplete = () => {
    markCompleteManually.mutate();
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{title}</h3>
          
          {loadingYouTubeApi ? (
            <div className="bg-gray-100 aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">Loading YouTube Player...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div ref={playerContainerRef} className="aspect-video bg-gray-100" />
                
                {isVideoCompleted && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <p className="font-medium">Video Completed</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={restartVideo}
                      >
                        Watch Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                      onClick={togglePlayPause}
                      disabled={!playerReady}
                    >
                      {isPlaying ? (
                        <PauseCircle className="h-5 w-5" />
                      ) : (
                        <PlayCircle className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                      onClick={restartVideo}
                      disabled={!playerReady}
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {!isVideoCompleted && progress > 0 && (
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={handleMarkComplete}
                      disabled={markCompleteManually.isPending}
                    >
                      {markCompleteManually.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}