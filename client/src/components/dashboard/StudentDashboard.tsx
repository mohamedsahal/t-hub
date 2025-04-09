import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import AchievementBadges from "./AchievementBadges";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Award, 
  CreditCard, 
  Download 
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      
      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Enrolled Courses</CardTitle>
                <CardDescription>Track your progress and continue learning</CardDescription>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length > 0 ? (
                  <div className="space-y-6">
                    {enrolledCourses.map((course: any) => (
                      <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-lg truncate">{course.title}</h3>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                            
                            <div className="flex items-center text-sm gap-3 mb-3 flex-wrap">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                <span>{course.duration} weeks</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                <span>Enrolled: {formatDate(new Date())}</span>
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
                            <Badge 
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20"
                            >
                              {course.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Courses</p>
                        <p className="text-xs text-gray-500">Enrolled</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-xs text-gray-500">Courses</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full mr-3">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Certificates</p>
                        <p className="text-xs text-gray-500">Earned</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{certificates.length}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Suggested Courses</h4>
                  <div className="space-y-2">
                    <Link href="/courses?type=multimedia">
                      <span className="text-primary hover:underline text-sm block cursor-pointer">
                        Multimedia Group Course Bundle
                      </span>
                    </Link>
                    <Link href="/courses?type=development">
                      <span className="text-primary hover:underline text-sm block cursor-pointer">
                        Full Stack Web Development
                      </span>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
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
