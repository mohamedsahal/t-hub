import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import AchievementBadges from "./AchievementBadges";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Award, 
  CreditCard, 
  Download,
  Bell,
  Bookmark,
  TrendingUp,
  BarChart,
  Info,
  Star,
  AlertCircle,
  ArrowRight,
  FileText,
  RefreshCw
} from "lucide-react";

const StudentDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  // Student's enrolled courses
  const enrolledCourses = data?.enrolledCourses || [];
  const payments = data?.payments || [];
  const certificates = data?.certificates || [];

  // Calculate completed courses
  const completedCourses = enrolledCourses.filter(
    (course: any) => course.progressPercentage === 100 || course.status === 'completed'
  ).length;
  
  // Calculate average progress across all courses
  const averageProgress = enrolledCourses.length > 0 
    ? Math.round(
        enrolledCourses.reduce(
          (sum: number, course: any) => sum + (course.progressPercentage || 0), 
          0
        ) / enrolledCourses.length
      )
    : 0;
  
  // Get recently active courses (last 3)
  const recentCourses = [...enrolledCourses]
    .sort((a: any, b: any) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime())
    .slice(0, 3);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Learning Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">My Courses</p>
                  <p className="text-xs text-gray-500">Currently enrolled</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{enrolledCourses.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-xs text-gray-500">Finished courses</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{completedCourses}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <BarChart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-xs text-gray-500">Average completion</p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-3">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Certificates</p>
                  <p className="text-xs text-gray-500">Achievements earned</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{certificates.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="space-y-6">
          {/* Recent Activity */}
          {recentCourses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentCourses.map((course: any) => (
                    <Card key={`recent-${course.id}`} className="overflow-hidden border shadow-sm hover:shadow transition-shadow">
                      <div className="h-3 bg-primary w-full" />
                      <CardContent className="p-4">
                        <h3 className="font-medium text-base line-clamp-1 mb-1">{course.title}</h3>
                        <div className="flex flex-col space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{course.progressPercentage || 0}%</span>
                            </div>
                            <Progress value={course.progressPercentage || 0} className="h-1" />
                          </div>
                          <Link href={`/courses/${course.id}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              {course.progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Your Enrolled Courses
                  </CardTitle>
                  <CardDescription>Track your progress and continue learning</CardDescription>
                </div>
                <Link href="/courses">
                  <Button variant="outline" size="sm">
                    Browse More Courses
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length > 0 ? (
                  <div className="space-y-6">
                    {enrolledCourses.map((course: any) => (
                      <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-lg truncate">{course.title}</h3>
                              {course.progressPercentage >= 75 && course.progressPercentage < 100 && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                  Almost Complete
                                </Badge>
                              )}
                              {course.progressPercentage === 100 && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                            
                            <div className="flex items-center text-sm gap-3 mb-3 flex-wrap">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                <span>{formatDuration(course.duration)}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                <span>Enrolled: {formatDate(new Date(course.enrollmentDate || new Date()))}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">{course.progressPercentage || 0}%</span>
                              </div>
                              <Progress value={course.progressPercentage || 0} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 min-w-[120px]">
                            <Link href={`/courses/${course.id}`}>
                              <Button size="sm" className="w-full">
                                <BookOpen className="h-4 w-4 mr-2" /> 
                                {course.progressPercentage > 0 ? 'Continue' : 'Get Started'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-2 text-lg font-medium">No courses yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't enrolled in any courses yet.
                    </p>
                    <Link href="/courses">
                      <Button className="mt-4">Browse Courses</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Bell className="mr-2 h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Info className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New course content available</p>
                        <p className="text-xs text-gray-500 mt-1">Check out the updated materials in your enrolled courses.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Assignment deadline approaching</p>
                        <p className="text-xs text-gray-500 mt-1">You have assignments due in the next 48 hours.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Star className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Achievement unlocked</p>
                        <p className="text-xs text-gray-500 mt-1">You've earned the "Quick Learner" badge.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="link" className="text-xs h-auto p-0">
                    View all notifications
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Bookmark className="mr-2 h-5 w-5" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-3 hover:shadow-sm transition-shadow">
                      <Link href="/courses?type=multimedia">
                        <h4 className="font-medium text-sm mb-1">Multimedia Group Course Bundle</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>12 weeks</span>
                          <span className="mx-2">•</span>
                          <FileText className="h-3 w-3 mr-1" />
                          <span>5 courses</span>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="border rounded-md p-3 hover:shadow-sm transition-shadow">
                      <Link href="/courses?type=development">
                        <h4 className="font-medium text-sm mb-1">Full Stack Web Development</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>16 weeks</span>
                          <span className="mx-2">•</span>
                          <Star className="h-3 w-3 mr-1" />
                          <span>Bestseller</span>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="border rounded-md p-3 hover:shadow-sm transition-shadow">
                      <Link href="/specialist-programs">
                        <h4 className="font-medium text-sm mb-1">Specialist Programs</h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          <span>Industry-recognized credentials</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href="/courses">
                    <Button variant="link" className="text-xs h-auto p-0 flex items-center">
                      Browse all courses <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your course payment records</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 last:border-b-0 gap-3">
                      <div>
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
                          <span className="font-medium">Course ID: {payment.courseId}</span>
                        </div>
                        <div className="text-sm text-gray-500 ml-7">
                          {formatDate(payment.paymentDate)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        <Badge className={
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }>
                          {payment.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" /> Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium">No payments yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't made any payments yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>Your installment payment schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium">No upcoming payments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any scheduled installment payments.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>Showcase your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((certificate: any) => (
                    <div key={certificate.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center mb-3">
                        <Award className="h-6 w-6 text-primary mr-2" />
                        <h3 className="font-medium">Course ID: {certificate.courseId}</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Certificate ID:</span>
                          <span className="font-medium">{certificate.certificateId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Issue Date:</span>
                          <span>{formatDate(certificate.issueDate)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        <Button size="sm">View Certificate</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium">No certificates yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete a course to earn your certificate.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-6">
          <AchievementBadges />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StudentDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      
      <Skeleton className="h-10 w-full max-w-md" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-9 w-9 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
