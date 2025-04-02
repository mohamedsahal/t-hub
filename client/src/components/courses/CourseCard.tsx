import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users } from "lucide-react";
import { formatCurrency, formatDuration, getCourseTypeLabel, getCourseTypeColor } from "@/lib/utils";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string;
    type: string;
    duration: number;
    price: number;
    imageUrl?: string;
  };
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <div className="relative">
        <img 
          src={course.imageUrl || `https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1471&q=80`} 
          alt={course.title} 
          className="w-full h-48 object-cover"
        />
        {course.type === 'development' && (
          <div className="absolute top-0 right-0 m-2">
            <Badge variant="secondary" className="bg-amber-500 text-white">
              Best Seller
            </Badge>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 font-inter">{course.title}</h3>
          <Badge className={getCourseTypeColor(course.type)}>
            {getCourseTypeLabel(course.type)}
          </Badge>
        </div>
        <p className="text-gray-600 mb-4">
          {course.description.length > 100 
            ? `${course.description.substring(0, 100)}...` 
            : course.description}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(course.price)}</span>
            <span className="text-sm text-gray-500 ml-1">/ {formatDuration(course.duration)}</span>
          </div>
          <Link href={`/courses/${course.id}`}>
            <Button className="bg-gradient-to-r from-[#3cb878] to-[#0080c9] hover:from-[#359e6a] hover:to-[#0070b3] text-white font-semibold shadow-md">
              Enroll Now
            </Button>
          </Link>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" /> {formatDuration(course.duration)}
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" /> 120+ students
          </div>
          <div className="flex items-center">
            <Star className="mr-1 h-4 w-4 text-yellow-400" /> 4.8
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
