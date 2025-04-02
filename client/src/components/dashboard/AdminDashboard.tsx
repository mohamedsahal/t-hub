import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Loader2, 
  Clock,
  Award,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: courseData, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ["/api/testimonials"],
  });

  // Mutation for approving testimonials
  const publishTestimonialMutation = useMutation({
    mutationFn: async (testimonialId: number) => {
      const response = await apiRequest("PUT", `/api/testimonials/${testimonialId}/publish`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      toast({
        title: "Success",
        description: "Testimonial has been published",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to publish testimonial",
      });
    },
  });

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // Dashboard statistics
  const stats = [
    {
      title: "Total Students",
      value: data?.studentCount || 0,
      icon: <Users className="h-8 w-8 text-primary" />,
      change: "+12%",
    },
    {
      title: "Total Courses",
      value: data?.courseCount || 0,
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      change: "+5%",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(data?.totalRevenue || 0),
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      change: "+23%",
    },
    {
      title: "Active Teachers",
      value: data?.teacherCount || 0,
      icon: <Users className="h-8 w-8 text-amber-600" />,
      change: "+2",
    },
  ];

  // Dummy data for charts
  const revenueData = [
    { name: "Jan", revenue: 1500 },
    { name: "Feb", revenue: 2500 },
    { name: "Mar", revenue: 4000 },
    { name: "Apr", revenue: 3800 },
    { name: "May", revenue: 5000 },
    { name: "Jun", revenue: 4500 },
  ];

  const courseDistribution = [
    { name: "Multimedia", value: courseData?.filter((c: any) => c.type === "multimedia").length || 0 },
    { name: "Accounting", value: courseData?.filter((c: any) => c.type === "accounting").length || 0 },
    { name: "Marketing", value: courseData?.filter((c: any) => c.type === "marketing").length || 0 },
    { name: "Development", value: courseData?.filter((c: any) => c.type === "development").length || 0 },
    { name: "Diploma", value: courseData?.filter((c: any) => c.type === "diploma").length || 0 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const handlePublishTestimonial = (id: number) => {
    publishTestimonialMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                      {stat.change && (
                        <p className="text-xs text-green-600 mt-1">
                          <span>{stat.change}</span> from last month
                        </p>
                      )}
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {courseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [value, "Courses"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentPayments?.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">Student ID: {payment.userId}</TableCell>
                      <TableCell>Course ID: {payment.courseId}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.recentPayments?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No recent payments
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
                    {courseData?.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell className="capitalize">{course.type}</TableCell>
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
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Analytics and management of student enrollments will be shown here.
              </p>
              <div className="flex items-center justify-center p-12 border border-dashed rounded-md">
                <div className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">Coming Soon</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Advanced student management features are under development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="testimonials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
              {testimonialsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials?.filter((t: any) => !t.isPublished).map((testimonial: any) => (
                    <div key={testimonial.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {testimonial.userId?.toString().charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">User ID: {testimonial.userId}</div>
                            <div className="text-sm text-gray-500">Course ID: {testimonial.courseId}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge>Rating: {testimonial.rating}/5</Badge>
                          {testimonial.isPublished ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">"{testimonial.comment}"</p>
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => handlePublishTestimonial(testimonial.id)}
                          disabled={publishTestimonialMutation.isPending}
                        >
                          {publishTestimonialMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve & Publish
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {testimonials?.filter((t: any) => !t.isPublished).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No pending testimonials to review
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Published Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
              {testimonialsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials?.filter((t: any) => t.isPublished).map((testimonial: any) => (
                    <div key={testimonial.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {testimonial.userId?.toString().charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">User ID: {testimonial.userId}</div>
                            <div className="text-sm text-gray-500">Course ID: {testimonial.courseId}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Published
                        </Badge>
                      </div>
                      <p className="text-gray-600">"{testimonial.comment}"</p>
                    </div>
                  ))}
                  {testimonials?.filter((t: any) => t.isPublished).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No published testimonials yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminDashboardSkeleton = () => {
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
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
