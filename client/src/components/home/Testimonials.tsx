import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="text-amber-400 flex">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill={i < Math.floor(rating) ? "currentColor" : (i < rating ? "currentColor" : "none")}
          stroke="currentColor"
        >
          {i < Math.floor(rating) || (i < rating && rating % 1 === 0) ? (
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          ) : i < rating ? (
            // Half star
            <>
              <defs>
                <linearGradient id={`half-star-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#half-star-${i})`}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </>
          ) : (
            <path
              strokeWidth="1"
              fill="none"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          )}
        </svg>
      ))}
    </div>
  );
};

const Testimonials = () => {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["/api/testimonials"],
  });

  // Mock testimonials for UI if none available from API
  const testimonialData = testimonials || [
    {
      id: 1,
      rating: 5,
      comment: "The Photoshop and Illustrator courses completely transformed my design skills. The instructors were knowledgeable and the hands-on projects helped me build a strong portfolio. I now work as a freelance graphic designer for international clients.",
      userName: "Amina Hassan",
      userTitle: "Graphic Designer"
    },
    {
      id: 2,
      rating: 5,
      comment: "The Web Development Bootcamp was intense but incredibly rewarding. I went from knowing nothing about coding to building full-stack applications in 24 weeks. The job placement support was excellent, and I landed a developer position right after graduation.",
      userName: "Omar Farah",
      userTitle: "Web Developer"
    },
    {
      id: 3,
      rating: 4.5,
      comment: "I completed the QuickBooks Accounting course while working full-time. The flexible schedule and installment payment option made it possible for me to upgrade my skills without financial stress. Now I manage accounts for multiple small businesses.",
      userName: "Fartun Ahmed",
      userTitle: "Accounting Specialist"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter text-gray-900">What Our Students Say</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Hear from our graduates who have successfully completed our courses and advanced their careers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, index) => (
              <div key={index} className="bg-neutral-light rounded-lg p-8 shadow-sm">
                <div className="mb-4">
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-24 w-full mb-6" />
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32 mt-1" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            (testimonials || testimonialData).map((testimonial: any) => (
              <div key={testimonial.id} className="bg-neutral-light rounded-lg p-8 shadow-sm">
                <div className="flex items-center mb-4">
                  <StarRating rating={testimonial.rating} />
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{testimonial.userName}</h4>
                    <p className="text-sm text-gray-500">{testimonial.userTitle}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
