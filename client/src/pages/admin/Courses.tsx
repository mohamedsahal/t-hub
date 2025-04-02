import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MoreHorizontal, Search, Plus, Edit, Trash, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Course } from "@shared/schema";

// This would be a real API call in production
const mockCourses: Course[] = [
  {
    id: 1,
    title: "Photoshop for Graphic Design",
    description: "Learn the essentials of Photoshop for graphic design and digital artwork creation.",
    price: 99.99,
    duration: 6, // weeks
    type: "multimedia",
    imageUrl: "https://example.com/images/photoshop-course.jpg",
    status: "published",
    teacherId: 3, // instructor ID
    createdAt: new Date("2025-03-10"),
  },
  {
    id: 2,
    title: "QuickBooks Accounting",
    description: "A comprehensive course on QuickBooks for small business accounting.",
    price: 129.99,
    duration: 8, // weeks
    type: "accounting",
    imageUrl: "https://example.com/images/quickbooks-course.jpg",
    status: "published",
    teacherId: 2, // instructor ID
    createdAt: new Date("2025-03-12"),
  },
  {
    id: 3,
    title: "Digital Marketing Fundamentals",
    description: "Learn digital marketing strategies including SEO, social media, and email marketing.",
    price: 149.99,
    duration: 10, // weeks
    type: "marketing",
    imageUrl: "https://example.com/images/digital-marketing-course.jpg",
    status: "draft",
    teacherId: 3, // instructor ID
    createdAt: new Date("2025-03-15"),
  }
];

export default function CoursesAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

  // This would be a real query in production
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
    queryFn: () => Promise.resolve(mockCourses),
  });

  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (courseId: number) => {
    setCourseToDelete(courseId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // This would be a real mutation in production
    console.log(`Deleting course with ID: ${courseToDelete}`);
    setIsDeleteDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Course Management</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              Manage all courses on the platform, including published, draft, and archived courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses?.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          <CourseCategoryBadge type={course.type} />
                        </TableCell>
                        <TableCell>${course.price.toFixed(2)}</TableCell>
                        <TableCell>{course.teacherId ? `Teacher ID: ${course.teacherId}` : "-"}</TableCell>
                        <TableCell>
                          <CourseStatusBadge status={course.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(course.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(course.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCourses?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No courses found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface CourseCategoryBadgeProps {
  type: string;
}

function CourseCategoryBadge({ type }: CourseCategoryBadgeProps) {
  const variants: Record<string, string> = {
    multimedia: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    accounting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    marketing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    development: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    diploma: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  const labels: Record<string, string> = {
    multimedia: "Multimedia",
    accounting: "Accounting",
    marketing: "Marketing",
    development: "Development",
    diploma: "Diploma",
  };

  return (
    <Badge variant="outline" className={`${variants[type] || "bg-gray-100 text-gray-800"} border-none`}>
      {labels[type] || type}
    </Badge>
  );
}

interface CourseStatusBadgeProps {
  status: string;
}

function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  const variants: Record<string, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  return (
    <Badge variant="outline" className={`${variants[status]} border-none`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}