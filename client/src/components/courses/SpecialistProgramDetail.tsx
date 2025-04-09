import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { CheckCircle, Clock, Users, BookOpen, Award, Calendar, ArrowRight, Layers } from "lucide-react";
import ProgramTimeline from "./ProgramTimeline";
import { useState } from "react";

// Define types
interface SpecialistProgram {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string | null;
  isActive: boolean;
  isVisible: boolean;
  hasDiscounted: boolean;
  discountedPrice: number | null;
  discountExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  category: string;
  imageUrl: string | null;
  duration: number;
}

interface ProgramCourse {
  id: number;
  programId: number;
  courseId: number;
  order: number;
  isRequired: boolean;
  course?: Course;
}

interface SpecialistProgramDetailProps {
  programId: string;
}

export default function SpecialistProgramDetail({ programId }: SpecialistProgramDetailProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Fetch the specialist program
  const { data: program, isLoading: programLoading } = useQuery<SpecialistProgram>({
    queryKey: [`/api/specialist-programs/${programId}`],
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  // Fetch program courses
  const { data: programCourses = [], isLoading: coursesLoading } = useQuery<ProgramCourse[]>({
    queryKey: [`/api/specialist-programs/${programId}/courses`],
    enabled: !!programId,
  });

  // Handle course selection from timeline
  const handleCourseSelect = (courseId: number) => {
    setSelectedCourseId(courseId);
    // Scroll to the course details section
    document.getElementById('course-details')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find selected course details
  const selectedCourse = selectedCourseId 
    ? programCourses.find(pc => pc.course?.id === selectedCourseId)?.course 
    : programCourses[0]?.course;

  if (programLoading || coursesLoading) {
    return <SpecialistProgramDetailSkeleton />;
  }

  if (!program) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Program not found</h2>
          <p className="mt-2 text-lg text-gray-600">
            The program you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/courses">
            <Button className="mt-6">Browse All Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const programBenefits = [
    "Complete learning roadmap with structured progression",
    "Save up to 20% compared to individual course pricing",
    "Earn a comprehensive program certificate",
    "Access to cohort-based learning and peer support",
    "Regular sessions with industry experts",
  ];

  // Calculate original price (sum of all courses)
  const originalPrice = programCourses.reduce((total, pc) => {
    return total + (pc.course?.price || 0);
  }, 0);

  // Calculate discount amount
  const discountAmount = originalPrice - program.price;
  const discountPercentage = Math.round((discountAmount / originalPrice) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-blue-600 hover:bg-blue-700">
              Specialist Program
            </Badge>
            {program.hasDiscounted && (
              <Badge variant="secondary" className="bg-green-600 text-white">
                Special Offer
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{program.name}</h1>

          <div className="flex items-center text-sm text-gray-500 mb-6 flex-wrap gap-4">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" /> {formatDuration(program.duration)}
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" /> Multiple cohorts available
            </div>
            <div className="flex items-center">
              <Layers className="mr-1 h-4 w-4" /> {programCourses.length} courses
            </div>
            <div className="flex items-center">
              <Award className="mr-1 h-4 w-4" /> Program certificate
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Program Timeline</TabsTrigger>
                <TabsTrigger value="courses">Included Courses</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Program Description</h3>
                  <p className="text-gray-600">{program.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Program Benefits</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {programBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-primary mt-1 mr-2 h-5 w-5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <ProgramTimeline 
                  programCourses={programCourses}
                  onCourseSelect={handleCourseSelect}
                />
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <div id="course-details">
                  <h3 className="text-xl font-semibold mb-3">Included Courses</h3>
                  <div className="space-y-4">
                    {programCourses.map((programCourse) => {
                      const course = programCourse.course;
                      const isSelected = selectedCourseId === course?.id;
                      
                      if (!course) return null;
                      
                      return (
                        <Card 
                          key={programCourse.id} 
                          className={`transition-all duration-300 ${isSelected ? 'border-primary shadow-md' : 'border-gray-200'}`}
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{course.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Clock className="h-4 w-4" /> 
                                    <span>{course.duration} weeks</span>
                                    <span className="text-primary font-medium">${course.price}</span>
                                  </div>
                                </CardDescription>
                              </div>
                              <Badge variant="outline">Course {programCourse.order}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 text-sm text-muted-foreground">
                            <p className="line-clamp-2">{course.description}</p>
                          </CardContent>
                          {isSelected && (
                            <CardFooter className="p-4 pt-0 flex justify-end">
                              <Link href={`/courses/${course.id}`}>
                                <Button variant="outline" size="sm">
                                  View Course Details <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </CardFooter>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
            <img
              src={program.imageUrl || `https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1471&q=80`}
              alt={program.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="mb-4">
                {program.hasDiscounted && program.discountedPrice ? (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(program.discountedPrice)}
                    </span>
                    <span className="text-lg line-through text-gray-500 ml-2">
                      {formatCurrency(program.price)}
                    </span>
                    <div className="text-green-600 text-sm font-medium mt-1">
                      Save {formatCurrency(program.price - program.discountedPrice)} ({discountPercentage}% off)
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(program.price)}
                    </span>
                    <div className="text-green-600 text-sm font-medium mt-1">
                      Save {formatCurrency(discountAmount)} ({discountPercentage}% off individual courses)
                    </div>
                  </div>
                )}
                
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Calendar className="mr-1 h-4 w-4" /> 
                  Complete program: {formatDuration(program.duration)}
                </div>
              </div>

              <div className="space-y-4">
                <Link href={isAuthenticated ? `/payment/specialist/${program.id}` : `/auth?redirect=${encodeURIComponent(`/payment/specialist/${program.id}`)}`}>
                  <Button size="lg" className="w-full">
                    {isAuthenticated ? "Enroll in Program" : "Login to Enroll"}
                  </Button>
                </Link>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-lg mb-2">This program includes:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {programCourses.length} complete courses
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {formatDuration(program.duration)} of total content
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Program completion certificate
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Dedicated program advisor
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Industry-recognized credential
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SpecialistProgramDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />

            <Skeleton className="h-6 w-40 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-6">
              <Skeleton className="h-10 w-32 mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-0.5 w-full mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center mb-2">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};