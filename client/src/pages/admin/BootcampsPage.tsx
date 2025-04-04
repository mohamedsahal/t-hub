import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Clock, 
  LayoutList, 
  Eye,
  Video,
  Calendar,
  Users,
  CreditCard
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: number;
  level: string;
  type: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  startDate?: string;
  hasDrippingContent?: boolean;
  hasOnlineSessions?: boolean;
  installments?: number;
}

export default function BootcampsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // Fetch courses data
  const { data: allCourses, isLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/courses');
        return response;
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
      }
    }
  });

  // Filter courses by type and search query
  const courses = allCourses
    ? allCourses
        .filter((course: Course) => course.type === 'bootcamp')
        .filter((course: Course) => 
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Function to get status badge display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Navigate to course builder
  const goToCourseBuilder = (courseId: number) => {
    setLocation(`/admin/course-builder/${courseId}`);
  };

  // Navigate to edit course
  const editCourse = (courseId: number) => {
    setLocation(`/admin/courses/bootcamp/edit/${courseId}`);
  };

  // Navigate to sessions management
  const manageSessions = (courseId: number) => {
    setLocation(`/admin/courses/bootcamp/${courseId}/sessions`);
  };

  // Navigate to create new course
  const createNewCourse = () => {
    setLocation('/admin/courses/bootcamp/create');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bootcamps</h1>
            <p className="text-muted-foreground">
              Manage intensive training bootcamps with dripping content, online sessions, and installment payments
            </p>
          </div>
          <Button onClick={createNewCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Create Bootcamp
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Bootcamps</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bootcamps..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading bootcamps...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No bootcamps found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-4">
                  You haven't created any bootcamps yet, or none match your search criteria.
                </p>
                <Button onClick={createNewCourse}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bootcamp
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course: Course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>${course.price}</TableCell>
                      <TableCell>{course.duration} weeks</TableCell>
                      <TableCell>
                        {course.startDate ? new Date(course.startDate).toLocaleDateString() : 'TBD'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {course.hasDrippingContent && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Calendar className="h-3 w-3 mr-1" />
                              Drip
                            </Badge>
                          )}
                          {course.hasOnlineSessions && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Video className="h-3 w-3 mr-1" />
                              Sessions
                            </Badge>
                          )}
                          {course.installments && course.installments > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {course.installments}x
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editCourse(course.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => goToCourseBuilder(course.id)}
                          >
                            <LayoutList className="h-4 w-4" />
                          </Button>
                          {course.hasOnlineSessions && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => manageSessions(course.id)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}