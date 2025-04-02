import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CourseCard from "@/components/courses/CourseCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Courses = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Extract type from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const type = params.get("type");
    if (type) {
      setActiveTab(type);
    } else {
      setActiveTab("all");
    }
  }, [location]);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Filter courses based on active tab and search term
  const filteredCourses = courses
    ? courses
        .filter((course: any) => 
          activeTab === "all" || course.type === activeTab
        )
        .filter((course: any) => 
          searchTerm === "" || 
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Courses</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Choose from our wide range of professional courses designed to help you succeed in today's competitive job market.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="multimedia">Multimedia</TabsTrigger>
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="diploma">Diploma</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
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
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button className="mt-4" onClick={() => {setActiveTab("all"); setSearchTerm("");}}>
                View All Courses
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
