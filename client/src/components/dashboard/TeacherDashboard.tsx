import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getCourseTypeLabel } from "@/lib/utils";
import { Users, BookOpen, LineChart, GraduationCap } from "lucide-react";

const TeacherDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  // Dashboard statistics
  const stats = [
    {
      title: "My Courses",
      value: data?.courses?.length || 0,
      icon: <BookOpen className="h-8 w-8 text-primary" />,
    },
    {
      title: "Total Students",
      value: data?.totalStudents || 0,
      icon: <Users className="h-8 w-8 text-blue-600" />,
    },
    {
      title: "Active Students",
      value: data?.activeStudents || 0,
      icon: <GraduationCap className="h-8 w-8 text-green-600" />,
    },
    {
      title: "Course Rating",
      value: "4.8",
      icon: <LineChart className="h-8 w-8 text-amber-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.courses?.map((course: any) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{getCourseTypeLabel(course.type)}</TableCell>
                      <TableCell>{course.duration} weeks</TableCell>
                      <TableCell>{formatCurrency(course.price)}</TableCell>
                      <TableCell>
                        <Badge className={
                          course.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : course.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                        }>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.courses?.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        You don't have any courses yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              <div className="mt-6">
                <Button>
                  <BookOpen className="mr-2 h-4 w-4" /> Create New Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Students Enrolled in Your Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium">Student List</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                  This section will show all students enrolled in your courses with their progress and assignment submissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium">Assignment Management</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                  Create, manage, and grade assignments for your courses. Track student submissions and provide feedback.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 border-b pb-4 last:border-b-0">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">New Student Enrollment</p>
                  <p className="text-sm text-gray-500">A new student enrolled in your {i === 0 ? "Photoshop" : i === 1 ? "Web Development" : "QuickBooks"} course.</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * i))}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-10 w-full max-w-md" />
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-24" />
                ))}
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  {[...Array(6)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-24" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 pb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
