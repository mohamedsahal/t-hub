import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EnhancedCourseBuilder from "@/components/dashboard/EnhancedCourseBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ShortCourseBuilderPage() {
  const [, setLocation] = useLocation();
  
  // Get the course ID from URL params
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? parseInt(courseId) : 0;
  
  // Fetch course info
  const { data: course, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', id],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/admin/courses/${id}`);
        return response;
      } catch (error) {
        console.error("Failed to fetch course:", error);
        return null;
      }
    },
    enabled: id > 0
  });

  // Handle back button click
  const handleBackClick = () => {
    if (course && course.type === 'short') {
      setLocation('/admin/courses/short');
    } else {
      setLocation('/admin/courses');
    }
  };

  // Build the UI
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBackClick} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Short Course Builder</h1>
              <p className="text-muted-foreground">
                {isLoading 
                  ? 'Loading course...' 
                  : course 
                    ? `Building: ${course.title}` 
                    : 'Course not found'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => window.open(`/courses/${id}`, '_blank')}
            >
              Preview Course
            </Button>
            {course && course.status !== 'published' && (
              <Button 
                onClick={() => {
                  if (confirm('Are you sure you want to publish this course? It will be visible to all students.')) {
                    // TODO: Implement publish course API call
                    alert('Course publish feature coming soon!');
                  }
                }}
              >
                Publish Course
              </Button>
            )}
          </div>
        </div>

        {course && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>About Course Builder</AlertTitle>
            <AlertDescription>
              Create and organize your course content using modules and different types of content (lessons, quizzes, exams).
              Drag and drop to reorder modules and content within modules. All changes are saved automatically.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="settings">Course Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {id > 0 && <EnhancedCourseBuilder courseId={id} />}
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid gap-4 py-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Course Settings</AlertTitle>
                <AlertDescription>
                  Course settings can be edited from the course edit page. Click the back button and select the edit icon for this course.
                </AlertDescription>
              </Alert>
              
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Course Information</h3>
                <Separator className="my-4" />
                
                {isLoading ? (
                  <p>Loading course information...</p>
                ) : course ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Title</p>
                        <p>{course.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                        <p>${course.price}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-sm">{course.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                        <p>{course.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p>{course.duration} hours</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className="capitalize">{course.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/admin/courses/short/edit/${id}`)}
                      >
                        Edit Course Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p>Course not found</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}