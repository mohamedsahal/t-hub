import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronRight, Clock, BookOpen, GraduationCap } from "lucide-react";
import { useInView } from "framer-motion";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  category: string;
  imageUrl: string | null;
  duration: number;
}

interface ProgramCourse {
  id: number;
  programId: number;
  courseId: number;
  order: number;
  isRequired: boolean;
  course?: Course;
}

interface ProgramTimelineProps {
  programCourses: ProgramCourse[];
  onCourseSelect?: (courseId: number) => void;
}

export default function ProgramTimeline({ programCourses, onCourseSelect }: ProgramTimelineProps) {
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(timelineRef, { once: false, amount: 0.3 });
  
  // Sort courses by order
  const sortedCourses = [...programCourses].sort((a, b) => a.order - b.order);
  
  // Auto-play functionality
  useEffect(() => {
    if (!isInView || !isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveCourseIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= sortedCourses.length) {
          setIsAutoPlaying(false);
          return prev;
        }
        return nextIndex;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, sortedCourses.length, isInView]);
  
  // Start auto-play when the timeline comes into view
  useEffect(() => {
    if (isInView && !isAutoPlaying && sortedCourses.length > 1) {
      setIsAutoPlaying(true);
    }
  }, [isInView, isAutoPlaying, sortedCourses.length]);
  
  if (sortedCourses.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-md">
        <p className="text-muted-foreground">No courses in this program yet.</p>
      </div>
    );
  }
  
  // Calculate total program duration
  const totalDuration = sortedCourses.reduce((total, item) => {
    return total + (item.course?.duration || 0);
  }, 0);
  
  return (
    <div ref={timelineRef} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Program Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Total Duration: {totalDuration} weeks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center">
            <Clock className="mr-1 h-3 w-3" /> {totalDuration} weeks
          </Badge>
          <Badge variant="outline" className="flex items-center">
            <BookOpen className="mr-1 h-3 w-3" /> {sortedCourses.length} courses
          </Badge>
        </div>
      </div>
      
      <MotionConfig transition={{ duration: 0.5, ease: "easeInOut" }}>
        <div className="relative mt-8 pb-10">
          {/* Timeline Bar */}
          <div className="absolute top-5 left-5 h-full w-1 bg-gray-200 rounded-full">
            <motion.div 
              className="bg-primary w-1 rounded-full"
              initial={{ height: "0%" }}
              animate={{ 
                height: `${((activeCourseIndex + 1) / sortedCourses.length) * 100}%`
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Timeline Events */}
          <div className="relative pl-16">
            {sortedCourses.map((programCourse, index) => {
              const course = programCourse.course;
              const isActive = index === activeCourseIndex;
              const isPast = index < activeCourseIndex;
              
              return (
                <div key={programCourse.id} className="mb-8 relative">
                  {/* Timeline Node */}
                  <div 
                    className={`absolute -left-11 top-1 w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isActive ? 'border-primary bg-primary text-white scale-110' : 
                      isPast ? 'border-green-500 bg-green-500 text-white' : 
                      'border-gray-300 bg-white'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Course Card */}
                  <motion.div 
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isActive ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ 
                      x: 0, 
                      opacity: 1
                    }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setActiveCourseIndex(index);
                      onCourseSelect && course && onCourseSelect(course.id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{course?.title || `Course ${index + 1}`}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" /> 
                          <span>{course?.duration || 0} weeks</span>
                          {programCourse.isRequired && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 mt-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t text-sm">
                            <p className="text-muted-foreground line-clamp-2">
                              {course?.description || "No description available"}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              {course?.category && (
                                <Badge variant="outline" className="text-xs">
                                  {course.category}
                                </Badge>
                              )}
                              {course?.price && (
                                <Badge variant="outline" className="text-xs">
                                  ${course.price}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
            
            {/* Final Graduation Node */}
            <div className="mb-8 relative">
              <div className={`absolute -left-11 top-1 w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                activeCourseIndex === sortedCourses.length - 1 ? 'border-green-500 bg-green-500 text-white scale-110' : 'border-gray-300 bg-white'
              }`}>
                <GraduationCap className="h-5 w-5" />
              </div>
              
              <motion.div 
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeCourseIndex === sortedCourses.length - 1 ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200'
                }`}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <h4 className="font-semibold text-lg">Program Completion</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Earn your program certificate and advance your career
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </MotionConfig>
    </div>
  );
}