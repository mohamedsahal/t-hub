import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
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
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
      } else {
        setEmbedUrl(null);
      }
    } else {
      setEmbedUrl(null);
    }
  }, [section.videoUrl, section.contentType]);
  
  // Format text content with markdown
  useEffect(() => {
    if (section.contentType === "text" && section.content) {
      const html = parseMarkdown(section.content);
      setFormattedContent(html);
    } else {
      setFormattedContent("");
    }
  }, [section.content, section.contentType]);

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
            <div className="aspect-video w-full mb-4">
              <iframe 
                className="w-full h-full"
                src={embedUrl}
                title={section.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
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