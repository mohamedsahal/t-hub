import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CourseCard from "../courses/CourseCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const CourseCategories = () => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  // Extract type from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const type = params.get("type");
    if (type) {
      setActiveTab(type);
    }
  }, [location]);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== "all") {
      setLocation(`/courses?type=${value}`, { replace: true });
    } else {
      setLocation("/courses", { replace: true });
    }
  };

  const filteredCourses = courses
    ? activeTab === "all"
      ? courses
      : courses.filter((course: any) => course.type === activeTab)
    : [];

  return (
    <section className="py-12 bg-neutral-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter text-gray-900">Our Course Categories</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Choose from our wide range of professional courses designed to help you succeed in today's competitive job market.
          </p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <TabsList className="-mb-px flex space-x-8">
              <TabsTrigger value="all" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                All Courses
              </TabsTrigger>
              <TabsTrigger value="multimedia" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                Multimedia
              </TabsTrigger>
              <TabsTrigger value="accounting" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                Accounting
              </TabsTrigger>
              <TabsTrigger value="marketing" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                Digital Marketing
              </TabsTrigger>
              <TabsTrigger value="development" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                Web Development
              </TabsTrigger>
              <TabsTrigger value="diploma" className="whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium">
                Diploma Programs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-10 w-28" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.slice(0, 6).map((course: any) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {filteredCourses.length > 6 && (
                  <div className="text-center mt-12">
                    <Link href="/courses">
                      <a className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        View All Courses
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </Link>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {["multimedia", "accounting", "marketing", "development", "diploma"].map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-10 w-28" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course: any) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default CourseCategories;
