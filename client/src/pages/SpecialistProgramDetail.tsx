import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import SpecialistProgramDetailComponent from "@/components/courses/SpecialistProgramDetail";
import { Skeleton } from "@/components/ui/skeleton";

interface SpecialistProgramDetailPageProps {
  params: {
    id: string;
  };
}

const SpecialistProgramDetail = ({ params }: SpecialistProgramDetailPageProps) => {
  const programId = params.id;

  // Prefetch program data
  const { isLoading } = useQuery({
    queryKey: [`/api/specialist-programs/${programId}`],
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
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
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return <SpecialistProgramDetailComponent programId={programId} />;
};

export default SpecialistProgramDetail;