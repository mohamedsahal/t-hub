import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { marked } from "marked";

// Create a sync parser function to avoid Promise-related issues
function parseMarkdown(text: string | null): string {
  if (!text) return '';
  
  try {
    const result = marked.parse(text);
    // Handle both sync and async returns from marked
    if (typeof result === 'string') {
      return result;
    } else if (result && typeof result.then === 'function') {
      // We're in sync mode, so this shouldn't happen, but handle it anyway
      console.warn('Unexpected Promise from marked.parse');
      return text;
    }
    return String(result);
  } catch (e) {
    console.error("Error parsing markdown", e);
    return text;
  }
}

interface LessonPreviewProps {
  section: {
    title: string;
    type: "lesson" | "quiz" | "exam";
    contentType?: "text" | "video" | null;
    content?: string | null;
    videoUrl?: string | null;
  };
  onClose: () => void;
}

export default function LessonPreview({ section, onClose }: LessonPreviewProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [formattedContent, setFormattedContent] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0); 
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to extract YouTube video ID from different URL formats
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Set up the embed URL when the component mounts or videoUrl changes
  useEffect(() => {
    if (section.contentType === "video" && section.videoUrl) {
      const videoId = getYoutubeVideoId(section.videoUrl);
      if (videoId) {
        // Add parameters to:
        // - controls=0: Hide video controls
        // - modestbranding=1: Hide YouTube logo
        // - rel=0: Hide related videos
        // - showinfo=0: Hide video title and uploader info
        // - iv_load_policy=3: Hide annotations
        // - fs=0: Disable fullscreen button
        // - disablekb=1: Disable keyboard controls
        // - playsinline=1: Play inline on mobile
        // - origin=[domain]: Set domain for security
        const embedParams = new URLSearchParams({
          controls: '0',             // Hide player controls (most important)
          modestbranding: '1',       // Hide YouTube logo (though not 100% effective)
          rel: '0',                  // Don't show related videos
          showinfo: '0',             // Hide video title and uploader info
          iv_load_policy: '3',       // Hide video annotations
          fs: '0',                   // Disable fullscreen button
          disablekb: '1',            // Disable keyboard controls
          playsinline: '1',          // Play inline on mobile devices
          origin: window.location.origin, // Set domain for security
          enablejsapi: '1',          // Enable JavaScript API for our custom controls
          autoplay: '0',             // Don't autoplay on load
          mute: '0',                 // Don't mute by default
          theme: 'dark',             // Use dark theme for player elements
          color: 'white',            // Use white progress bar color
          widget_referrer: window.location.origin, // Set referrer domain
          cc_load_policy: '0',       // Don't show closed captions
          loop: '0',                 // Don't loop the video
          start: '0',                // Start from beginning
          autohide: '1',             // Hide video controls when playing
          playlist: videoId,         // Required for loop=1
          // Additional parameters to further remove branding
          showsearch: '0',           // Hide search box
          ecver: '2',                // Use enhanced privacy mode
        }).toString();
        
        // Use youtube-nocookie.com domain for enhanced privacy and reduced branding
        setEmbedUrl(`https://www.youtube-nocookie.com/embed/${videoId}?${embedParams}`);
      } else {
        setEmbedUrl(null);
      }
    } else {
      setEmbedUrl(null);
    }
  }, [section.videoUrl, section.contentType]);
  
  // Format time display (convert seconds to mm:ss format)
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return "0:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Function to get current video playback time from YouTube iframe
  const getCurrentTime = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*');
      } catch (error) {
        console.error("Failed to get current time:", error);
      }
    }
  };
  
  // Function to get video duration from YouTube iframe
  const getDuration = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"getDuration","args":""}', '*');
      } catch (error) {
        console.error("Failed to get duration:", error);
      }
    }
  };
  
  // Start progress tracking when video plays
  useEffect(() => {
    if (isPlaying) {
      // Set up interval to poll for current time and calculate progress
      progressInterval.current = setInterval(() => {
        getCurrentTime();
        if (duration === 0) {
          getDuration(); // Keep trying to get duration if not yet available
        }
      }, 500); // Update every half second for smoother progress
    } else if (progressInterval.current) {
      // Clear interval when paused or stopped
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isPlaying, duration]);
  
  // Listen for YouTube API messages
  useEffect(() => {
    // Event listener for messages from the YouTube iframe
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from our embedded YouTube iframe
      if (event.source === iframeRef.current?.contentWindow) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          // Handle state change events
          if (data.event === 'onStateChange') {
            // YT.PlayerState.PLAYING = 1
            if (data.info === 1) {
              setIsPlaying(true);
              getDuration(); // Get duration when video starts playing
            }
            // YT.PlayerState.ENDED = 0, YT.PlayerState.PAUSED = 2
            else if (data.info === 0 || data.info === 2) {
              setIsPlaying(false);
            }
          }
          // Handle getCurrentTime response
          else if (data.event === 'onReady') {
            // Video player is ready - now we can call API functions
            getDuration();
          }
          // Handle getDuration response
          else if (data.event === undefined && data.duration) {
            setDuration(data.duration);
          }
          // Handle getCurrentTime response
          else if (data.event === undefined && data.currentTime !== undefined) {
            setCurrentTime(data.currentTime);
            if (duration > 0) {
              // Calculate progress percentage
              const progressPercent = (data.currentTime / duration) * 100;
              setProgress(progressPercent);
            }
          }
        } catch (e) {
          // Not a JSON message or other error, ignore
        }
      }
    };

    // Add event listener for messages
    window.addEventListener('message', handleMessage);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [duration]);
  
  // Format text content with markdown
  useEffect(() => {
    if (section.contentType === "text" && section.content) {
      const html = parseMarkdown(section.content);
      setFormattedContent(html);
    } else {
      setFormattedContent("");
    }
  }, [section.content, section.contentType]);
  
  // Function to toggle video play state
  const togglePlay = () => {
    setIsPlaying(true);
    
    // Try to play the video using YouTube iframe API
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Send a postMessage to the YouTube iframe to play the video
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } catch (error) {
        console.error("Failed to play video through iframe API:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              {section.title}
              {section.type === "quiz" && <Badge className="ml-2 bg-blue-500">Quiz</Badge>}
              {section.type === "exam" && <Badge className="ml-2 bg-purple-500">Exam</Badge>}
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-auto flex-grow">
          {section.contentType === "video" && embedUrl ? (
            <div 
              className="aspect-video w-full mb-4 relative overflow-hidden rounded-lg shadow-lg"
            >
              {/* Video iframe - base layer */}
              <iframe 
                ref={iframeRef}
                className="w-full h-full relative z-0"
                src={embedUrl}
                title={section.title}
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              
              {/* Cover overlay to hide YouTube branding when not playing */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/90 pointer-events-none z-10"></div>
              )}
              
              {/* Clickable overlay for play/pause - spans entire video area */}
              <div 
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={togglePlay}
              >
                {/* Play button only shows when not playing */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary/80 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Custom video player controls - always visible, highest z-index */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16 pointer-events-none z-30 flex items-end px-4 pb-2">
                <div className="flex items-center w-full">
                  {/* Real progress bar */}
                  <div className="h-1 bg-white/30 rounded-full w-full mr-4 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-linear"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Real time display */}
                  <span className="text-white text-xs opacity-90 font-mono mr-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          ) : section.contentType === "text" && formattedContent ? (
            <div 
              className="prose prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ol:my-2 prose-ul:my-2 max-w-none" 
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No content available for preview.
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Close Preview</Button>
        </div>
      </Card>
    </div>
  );
}