import { useState, useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle, BookOpen, Calendar, Clock, BarChart3, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Interface for course type
interface Course {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  price: number;
  duration: number;
  imageUrl?: string;
}

// Course card component
const CourseCard = ({ course }: { course: Course }) => {
  // Determine badge text and color based on course type
  let badgeText = "";
  let badgeClass = "bg-green-100 text-green-800";

  switch (course.type) {
    case "short":
      badgeText = "Short Course";
      badgeClass = "bg-blue-100 text-blue-800";
      break;
    case "specialist":
      badgeText = "Specialist";
      badgeClass = "bg-purple-100 text-purple-800";
      break;
    case "bootcamp":
      badgeText = "Bootcamp";
      badgeClass = "bg-amber-100 text-amber-800";
      break;
    case "diploma":
      badgeText = "Diploma";
      badgeClass = "bg-green-100 text-green-800";
      break;
  }

  // Determine icon based on course type
  const CourseIcon = () => {
    switch (course.type) {
      case "short":
        return <Clock className="h-5 w-5 mr-2" />;
      case "specialist":
        return <BarChart3 className="h-5 w-5 mr-2" />;
      case "bootcamp":
        return <BookOpen className="h-5 w-5 mr-2" />;
      case "diploma":
        return <Award className="h-5 w-5 mr-2" />;
      default:
        return <BookOpen className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-200">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <CourseIcon />
            <span className="text-lg font-medium text-gray-600">{course.category}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
            {badgeText}
          </span>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description || "Learn skills that are in high demand in the industry."}</p>
        
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{course.duration} weeks</span>
          <span className="mx-2">•</span>
          <span className="font-semibold text-primary">{formatCurrency(course.price)}</span>
        </div>
        
        <Link href={`/courses/${course.id}`}>
          <Button className="w-full bg-gradient-to-r from-[#3cb878] to-[#0080c9] hover:from-[#2da768] hover:to-[#0070b9]">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const ProgramCategories = () => {
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch courses data
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Organize courses by type
  const shortCourses = courses.filter((course) => course.type === "short");
  const specialistCourses = courses.filter((course) => course.type === "specialist");
  const bootcampCourses = courses.filter((course) => course.type === "bootcamp");
  const diplomaCourses = courses.filter((course) => course.type === "diploma");

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Explore Our Programs
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from a variety of educational pathways designed to meet your career goals and learning needs
          </p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 mb-2">
            <TabsList className="inline-flex min-w-max sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 max-w-3xl mx-auto mb-3">
              <TabsTrigger value="all" className="px-3 py-1.5 text-sm sm:text-base">All Programs</TabsTrigger>
              <TabsTrigger value="short" className="px-3 py-1.5 text-sm sm:text-base">Short Courses</TabsTrigger>
              <TabsTrigger value="specialist" className="px-3 py-1.5 text-sm sm:text-base">Specialist</TabsTrigger>
              <TabsTrigger value="bootcamp" className="px-3 py-1.5 text-sm sm:text-base">Bootcamp</TabsTrigger>
              <TabsTrigger value="diploma" className="px-3 py-1.5 text-sm sm:text-base">Diploma</TabsTrigger>
            </TabsList>
          </div>

          {/* All Programs */}
          <TabsContent value="all">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.slice(0, 6).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {courses.length > 6 && (
                  <div className="text-center mt-10">
                    <Link href="/courses">
                      <Button variant="outline" size="lg">
                        View All Programs
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Short Courses */}
          <TabsContent value="short">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : shortCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shortCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {shortCourses.length > 3 && (
                  <div className="text-center mt-10">
                    <Link href="/courses?type=short">
                      <Button variant="outline" size="lg">
                        View All Short Courses
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Short Courses Available</h3>
                <p className="mt-2 text-gray-500">Check back soon for new short courses.</p>
              </div>
            )}
          </TabsContent>

          {/* Specialist Programs */}
          <TabsContent value="specialist">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : specialistCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specialistCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {specialistCourses.length > 3 && (
                  <div className="text-center mt-10">
                    <Link href="/courses?type=specialist">
                      <Button variant="outline" size="lg">
                        View All Specialist Programs
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Specialist Programs Available</h3>
                <p className="mt-2 text-gray-500">Check back soon for new specialist programs.</p>
              </div>
            )}
          </TabsContent>

          {/* Bootcamp Programs */}
          <TabsContent value="bootcamp">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bootcampCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bootcampCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {bootcampCourses.length > 3 && (
                  <div className="text-center mt-10">
                    <Link href="/courses?type=bootcamp">
                      <Button variant="outline" size="lg">
                        View All Bootcamp Programs
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Bootcamp Programs Available</h3>
                <p className="mt-2 text-gray-500">Check back soon for new bootcamp programs.</p>
              </div>
            )}
          </TabsContent>

          {/* Diploma Programs */}
          <TabsContent value="diploma">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : diplomaCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {diplomaCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
                
                {diplomaCourses.length > 3 && (
                  <div className="text-center mt-10">
                    <Link href="/courses?type=diploma">
                      <Button variant="outline" size="lg">
                        View All Diploma Programs
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Diploma Programs Available</h3>
                <p className="mt-2 text-gray-500">Check back soon for new diploma programs.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProgramCategories;
