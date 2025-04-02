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

// Sample data for charts
const monthlyEnrollments = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 19 },
  { name: 'Mar', count: 15 },
  { name: 'Apr', count: 23 },
  { name: 'May', count: 28 },
  { name: 'Jun', count: 25 },
  { name: 'Jul', count: 33 },
  { name: 'Aug', count: 21 },
  { name: 'Sep', count: 29 },
  { name: 'Oct', count: 35 },
  { name: 'Nov', count: 32 },
  { name: 'Dec', count: 37 },
];

const courseDistribution = [
  { name: 'Multimedia', value: 35 },
  { name: 'Accounting', value: 20 },
  { name: 'Marketing', value: 15 },
  { name: 'Development', value: 25 },
  { name: 'Diploma', value: 5 },
];

const revenueData = [
  { name: 'Week 1', oneTime: 2500, installment: 1800 },
  { name: 'Week 2', oneTime: 3200, installment: 2100 },
  { name: 'Week 3', oneTime: 2800, installment: 2400 },
  { name: 'Week 4', oneTime: 3800, installment: 2600 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Recent payment and enrollment data
const recentPayments = [
  { id: 1, student: 'Ahmed Mohamed', course: 'Adobe Photoshop Advanced', amount: 120, date: '2025-04-01', status: 'completed' },
  { id: 2, student: 'Fatima Hassan', course: 'Digital Marketing Basics', amount: 85, date: '2025-04-01', status: 'pending' },
  { id: 3, student: 'Omar Ali', course: 'Web Development Fundamentals', amount: 150, date: '2025-03-31', status: 'completed' },
  { id: 4, student: 'Amina Ibrahim', course: 'QuickBooks Introduction', amount: 95, date: '2025-03-30', status: 'failed' },
  { id: 5, student: 'Yusuf Abdi', course: 'Diploma in IT', amount: 350, date: '2025-03-29', status: 'completed' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  
  // These would be real queries in production
  const { data: usersCount, isLoading: isLoadingUsers } = useQuery<number>({
    queryKey: ['/api/admin/stats/users'],
    enabled: false, // Disabled since we don't have this endpoint yet
  });
  
  const { data: coursesCount, isLoading: isLoadingCourses } = useQuery<number>({
    queryKey: ['/api/admin/stats/courses'],
    enabled: false,
  });
  
  const { data: paymentsCount, isLoading: isLoadingPayments } = useQuery<number>({
    queryKey: ['/api/admin/stats/payments'],
    enabled: false,
  });
  
  const { data: certificatesCount, isLoading: isLoadingCertificates } = useQuery<number>({
    queryKey: ['/api/admin/stats/certificates'],
    enabled: false,
  });

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
            value={paymentsCount ? `$${paymentsCount}` : "$18,650"}
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
                          {courseDistribution.map((entry, index) => (
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
                      <TableRow>
                        <TableCell className="font-medium">Diploma in IT</TableCell>
                        <TableCell className="text-right">38</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Adobe Photoshop Advanced</TableCell>
                        <TableCell className="text-right">32</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Web Development Fundamentals</TableCell>
                        <TableCell className="text-right">29</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Digital Marketing Basics</TableCell>
                        <TableCell className="text-right">24</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">QuickBooks Introduction</TableCell>
                        <TableCell className="text-right">21</TableCell>
                      </TableRow>
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
                    {recentPayments.map((payment) => (
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
                    <TableRow>
                      <TableCell className="font-medium">Ahmed Mohamed</TableCell>
                      <TableCell>Adobe Photoshop Advanced</TableCell>
                      <TableCell>2025-04-01</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="h-2" />
                          <span className="text-xs text-muted-foreground">25%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Fatima Hassan</TableCell>
                      <TableCell>Digital Marketing Basics</TableCell>
                      <TableCell>2025-04-01</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={12} className="h-2" />
                          <span className="text-xs text-muted-foreground">12%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Omar Ali</TableCell>
                      <TableCell>Web Development Fundamentals</TableCell>
                      <TableCell>2025-03-31</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={38} className="h-2" />
                          <span className="text-xs text-muted-foreground">38%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Amina Ibrahim</TableCell>
                      <TableCell>QuickBooks Introduction</TableCell>
                      <TableCell>2025-03-30</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="h-2" />
                          <span className="text-xs text-muted-foreground">45%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Yusuf Abdi</TableCell>
                      <TableCell>Diploma in IT</TableCell>
                      <TableCell>2025-03-29</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2">
                          <Progress value={67} className="h-2" />
                          <span className="text-xs text-muted-foreground">67%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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