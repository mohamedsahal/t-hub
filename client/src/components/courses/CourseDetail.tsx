import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDuration, getCourseTypeLabel, getCourseTypeColor } from "@/lib/utils";
import { CheckCircle, Clock, Users, BookOpen, Award, Play, ChevronLeft, ChevronRight } from "lucide-react";
import CourseProgressTracker from "./CourseProgressTracker";
import YouTubeVideoPlayer from "./YouTubeVideoPlayer";

// Helper function to extract YouTube video ID from URL
const extractYouTubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  
  // Try to match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Define the Course type
interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: number;
  type: string;
  teacherId?: number;
  imageUrl?: string;
  [key: string]: any; // Allow for additional properties
}

interface CourseDetailProps {
  courseId: string;
}

const CourseDetail = ({ courseId }: CourseDetailProps) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    retry: 2,
    staleTime: 60000, // 1 minute
  });
  
  // Check if the user is enrolled in this course
  const { data: enrollmentData } = useQuery({
    queryKey: ['/api/dashboard'],
    enabled: isAuthenticated,
  });
  
  const isEnrolled = useMemo(() => {
    if (!enrollmentData?.enrolledCourses || !course) return false;
    return enrollmentData.enrolledCourses.some((enrolledCourse: any) => 
      enrolledCourse.id === Number(course.id)
    );
  }, [enrollmentData, course]);

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <p className="mt-2 text-lg text-gray-600">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/courses">
            <Button className="mt-6">Browse All Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const keyFeatures = [
    "Expert instructor-led training",
    "Hands-on practical exercises",
    "Real-world projects for your portfolio",
    "Flexible learning schedule",
    "Certificate upon completion",
  ];

  // If the user is enrolled, show the learning interface
  if (isEnrolled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{course.title}</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar - Course modules */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              
              <div className="space-y-3">
                {[1, 2, 3, 4].map((module) => (
                  <div key={module} className="border rounded-md p-3">
                    <h4 className="font-medium text-base mb-2">Module {module}</h4>
                    <ul className="space-y-2">
                      {[1, 2, 3].map((lesson) => (
                        <li key={lesson}>
                          <button 
                            className="flex items-center text-sm text-gray-600 hover:text-primary w-full text-left"
                          >
                            <BookOpen className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span className="truncate">Lesson {lesson}: {course.title.substring(0, 15)}...</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right content - Course preview */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Tabs defaultValue="content">
                <TabsList className="mb-6">
                  <TabsTrigger value="content">Course Material</TabsTrigger>
                  <TabsTrigger value="progress">Your Progress</TabsTrigger>
                  {course.videoUrl && <TabsTrigger value="video">Video</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Module 1: Introduction</h2>
                    <p className="text-gray-600 mb-4">
                      Welcome to {course.title}! In this module, you'll learn the fundamentals and get set up with everything you need to start.
                    </p>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                      <h3 className="font-medium mb-2">Learning Objectives:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Understand the core concepts of {course.title}</li>
                        <li>Set up your environment for optimal learning</li>
                        <li>Complete your first practical exercise</li>
                      </ul>
                    </div>
                    
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img 
                        src={course.imageUrl || `https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1471&q=80`}
                        alt="Module preview"
                        className="object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="prose max-w-none">
                      <h3>Getting Started</h3>
                      <p>
                        This course is designed to take you from beginner to proficient in {course.title}. 
                        We'll start with the basics and gradually move to more advanced topics.
                      </p>
                      
                      <h3>Required Materials</h3>
                      <p>
                        To get the most out of this course, make sure you have:
                      </p>
                      <ul>
                        <li>A computer with internet access</li>
                        <li>The required software installed (details in the next lesson)</li>
                        <li>A notebook for taking notes</li>
                      </ul>
                      
                      <h3>Course Structure</h3>
                      <p>
                        Each module contains video lessons, reading materials, practical exercises, 
                        and quizzes to test your knowledge. We recommend completing the modules in order.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="progress">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-3">Your Progress</h3>
                    <CourseProgressTracker courseId={Number(course.id)} courseTitle={course.title} />
                  </div>
                </TabsContent>
                
                {course.videoUrl && (
                  <TabsContent value="video">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold mb-3">Course Video</h3>
                      <YouTubeVideoPlayer 
                        videoId={extractYouTubeId(course.videoUrl) || ''} 
                        courseId={Number(course.id)}
                        sectionId={0} 
                        title={course.title}
                        isCompleted={false}
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
              
              <div className="mt-8 flex justify-between items-center pt-4 border-t">
                <Button variant="outline" disabled>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous Lesson
                </Button>
                
                <Button>
                  Next Lesson <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular course detail view for non-enrolled users
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className={getCourseTypeColor(course.type)}>
              {getCourseTypeLabel(course.type)}
            </Badge>
            {course.type === "development" && (
              <Badge variant="secondary" className="bg-amber-500 text-white">
                Best Seller
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>

          <div className="flex items-center text-sm text-gray-500 mb-6 flex-wrap gap-4">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" /> {formatDuration(course.duration)}
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" /> 120+ students
            </div>
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" /> Online & In-Class
            </div>
            <div className="flex items-center">
              <Award className="mr-1 h-4 w-4" /> Certificate Included
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                {isAuthenticated && <TabsTrigger value="progress">Progress</TabsTrigger>}
                {course.videoUrl && <TabsTrigger value="video">Video</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Course Description</h3>
                  <p className="text-gray-600">{course.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-primary mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-3">Course Curriculum</h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((module) => (
                      <div key={module} className="border rounded-md p-4">
                        <h4 className="font-medium text-lg mb-2">Module {module}</h4>
                        <ul className="space-y-2">
                          {[1, 2, 3].map((lesson) => (
                            <li key={lesson} className="flex items-center text-sm text-gray-600">
                              <BookOpen className="h-4 w-4 mr-2 text-primary" />
                              Lesson {lesson}: {course.title} - Part {lesson}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="instructor">
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">
                      {course.teacherId ? "T" : "I"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {course.teacherId ? "Teacher Name" : "Industry Expert"}
                    </h3>
                    <p className="text-gray-500">
                      {getCourseTypeLabel(course.type)} Specialist
                    </p>
                    <p className="mt-2 text-gray-600">
                      Our instructors are industry professionals with years of
                      practical experience in the field. They bring real-world
                      knowledge and insights to the classroom, ensuring that you
                      gain practical skills that are directly applicable to your
                      career.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              {isAuthenticated && (
                <TabsContent value="progress">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-3">Your Progress</h3>
                    <CourseProgressTracker courseId={Number(course.id)} courseTitle={course.title} />
                  </div>
                </TabsContent>
              )}
              
              {course.videoUrl && (
                <TabsContent value="video">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-3">Course Video</h3>
                    <YouTubeVideoPlayer 
                      videoId={extractYouTubeId(course.videoUrl) || ''} 
                      courseId={Number(course.id)}
                      sectionId={0} // Main video doesn't have a section
                      title={course.title}
                      isCompleted={false}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
            <img
              src={course.imageUrl || `https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1471&q=80`}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(course.price)}
                </span>
                <span className="text-gray-500 ml-2">
                  / {formatDuration(course.duration)}
                </span>
              </div>

              <div className="space-y-4">
                {!isEnrolled ? (
                  <Link href={isAuthenticated ? `/payment/${course.id}` : `/auth?redirect=${encodeURIComponent(`/payment/${course.id}`)}`}>
                    <Button size="lg" className="w-full">
                      {isAuthenticated ? "Enroll Now" : "Login to Enroll"}
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="w-full" disabled>
                    Already Enrolled
                  </Button>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium text-lg mb-2">This course includes:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Full lifetime access
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {formatDuration(course.duration)} of content
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Certificate of completion
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Instructor support
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Flexible payment options
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />

            <Skeleton className="h-6 w-40 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-6">
              <Skeleton className="h-10 w-32 mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-0.5 w-full mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center mb-2">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
