import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Users, BookOpen, CreditCard, Award, ArrowUpRight, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import UsersManagement from "@/components/dashboard/UsersManagement";

// Color definitions
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Type definitions for our API responses
interface DashboardData {
  courseCount: number;
  studentCount: number;
  teacherCount: number;
  totalRevenue: number;
  recentPayments: PaymentData[];
  monthlyEnrollments: MonthlyEnrollment[];
  courseDistribution: CourseDistribution[];
  topCourses: TopCourse[];
  revenueData: RevenueData[];
}

interface PaymentData {
  id: number;
  student: string;
  course: string;
  amount: number;
  date: string;
  status: string;
}

interface EnrollmentData {
  id: number;
  student: string;
  course: string;
  enrollmentDate: string;
  status: string;
  progress: number;
}

interface MonthlyEnrollment {
  name: string;
  count: number;
}

interface CourseDistribution {
  name: string;
  value: number;
}

interface TopCourse {
  id: number;
  title: string;
  enrollments: number;
}

interface RevenueData {
  name: string;
  oneTime: number;
  installment: number;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  
  // Fetch real data from API endpoints
  const { data: usersCount, isLoading: isLoadingUsers } = useQuery<number>({
    queryKey: ['/api/admin/stats/users'],
  });
  
  const { data: coursesCount, isLoading: isLoadingCourses } = useQuery<number>({
    queryKey: ['/api/admin/stats/courses'],
  });
  
  const { data: paymentsTotal, isLoading: isLoadingPayments } = useQuery<number>({
    queryKey: ['/api/admin/stats/payments'],
  });
  
  const { data: certificatesCount, isLoading: isLoadingCertificates } = useQuery<number>({
    queryKey: ['/api/admin/stats/certificates'],
  });
  
  // Get dashboard data with charts and detailed information
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });
  
  // Get recent payments for the payments tab
  const { data: recentPaymentsData, isLoading: isLoadingRecentPayments } = useQuery<PaymentData[]>({
    queryKey: ['/api/admin/recent-payments'],
  });
  
  // Get recent enrollments for the enrollments tab
  const { data: recentEnrollmentsData, isLoading: isLoadingRecentEnrollments } = useQuery<EnrollmentData[]>({
    queryKey: ['/api/admin/recent-enrollments'],
  });
  
  // Extract chart data from dashboardData or provide defaults
  const monthlyEnrollments = dashboardData?.monthlyEnrollments ?? [];
  const courseDistribution = dashboardData?.courseDistribution ?? [];
  const revenueData = dashboardData?.revenueData ?? [];
  const topCourses = dashboardData?.topCourses ?? [];
  
  // Safe access to payments and enrollments data
  const recentPayments = recentPaymentsData ?? [];
  const recentEnrollments = recentEnrollmentsData ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, Admin
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Users"
            value={usersCount || 120}
            description="+12% from last month"
            icon={<Users className="h-5 w-5 text-blue-500" />}
            loading={isLoadingUsers}
          />
          <StatsCard 
            title="Active Courses"
            value={coursesCount || 24}
            description="+3 new this month"
            icon={<BookOpen className="h-5 w-5 text-green-500" />}
            loading={isLoadingCourses}
          />
          <StatsCard 
            title="Revenue (USD)"
            value={paymentsTotal ? `$${paymentsTotal}` : "$0"}
            description="+22% from last month"
            icon={<CreditCard className="h-5 w-5 text-indigo-500" />}
            loading={isLoadingPayments}
          />
          <StatsCard 
            title="Certificates Issued"
            value={certificatesCount || 87}
            description="+5 this month"
            icon={<Award className="h-5 w-5 text-orange-500" />}
            loading={isLoadingCertificates}
          />
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Enrollments</CardTitle>
                  <CardDescription>
                    Number of student enrollments per month in 2025
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyEnrollments}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0070f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Distribution</CardTitle>
                  <CardDescription>
                    Enrollment distribution by course type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={courseDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {courseDistribution.map((entry: CourseDistribution, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>
                  Revenue comparison between one-time payments and installment plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Legend />
                      <Line type="monotone" dataKey="oneTime" stroke="#0070f3" activeDot={{ r: 8 }} name="One-time Payment" />
                      <Line type="monotone" dataKey="installment" stroke="#00c49f" name="Installment Plan" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Course Completion Rates</CardTitle>
                  <CardDescription>
                    Average completion rates by course type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CourseCompletionRate name="Multimedia" percentage={76} />
                  <CourseCompletionRate name="Accounting" percentage={82} />
                  <CourseCompletionRate name="Marketing" percentage={68} />
                  <CourseCompletionRate name="Development" percentage={73} />
                  <CourseCompletionRate name="Diploma Programs" percentage={91} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Courses</CardTitle>
                  <CardDescription>
                    Courses with highest enrollment rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-right">Enrollments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCourses.map((course: TopCourse) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell className="text-right">{course.enrollments}</TableCell>
                        </TableRow>
                      ))}
                      {topCourses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No course data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>
                  The most recent transactions across all courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment: PaymentData) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">#{payment.id}</TableCell>
                        <TableCell>{payment.student}</TableCell>
                        <TableCell>{payment.course}</TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="enrollments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
                <CardDescription>
                  Students who recently enrolled in courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEnrollments.map((enrollment: EnrollmentData) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.student}</TableCell>
                        <TableCell>{enrollment.course}</TableCell>
                        <TableCell>{enrollment.enrollmentDate}</TableCell>
                        <TableCell>{enrollment.status}</TableCell>
                        <TableCell className="w-[100px]">
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentEnrollments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No recent enrollments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, description, icon, loading = false }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

interface CourseCompletionRateProps {
  name: string;
  percentage: number;
}

function CourseCompletionRate({ name, percentage }: CourseCompletionRateProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div>{name}</div>
        <div className="font-medium">{percentage}%</div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

interface PaymentStatusBadgeProps {
  status: string;
}

function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}