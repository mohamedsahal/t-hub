import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Award, ArrowRight, Layers } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface SpecialistProgramCardProps {
  program: {
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
    // Add other properties as needed
  };
  courseCount?: number;
}

const SpecialistProgramCard = ({ program, courseCount = 3 }: SpecialistProgramCardProps) => {
  // Format the discount percentage
  const calculateDiscount = () => {
    if (program.hasDiscounted && program.discountedPrice) {
      const discount = ((program.price - program.discountedPrice) / program.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercentage = calculateDiscount();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <div className="relative">
        <img 
          src={program.imageUrl || `https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1471&q=80`} 
          alt={program.name} 
          className="w-full h-48 object-cover"
        />
        {program.hasDiscounted && program.discountedPrice && (
          <div className="absolute top-0 right-0 m-2">
            <Badge variant="secondary" className="bg-green-600 text-white">
              {discountPercentage}% Off
            </Badge>
          </div>
        )}
        <div className="absolute top-0 left-0 m-2">
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
            Specialist Program
          </Badge>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 font-inter">{program.name}</h3>
        </div>
        <p className="text-gray-600 mb-4">
          {program.description.length > 100 
            ? `${program.description.substring(0, 100)}...` 
            : program.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="flex items-center">
            <Layers className="mr-1 h-3 w-3" /> {courseCount} Courses
          </Badge>
          <Badge variant="outline" className="flex items-center">
            <Clock className="mr-1 h-3 w-3" /> {formatDuration(program.duration)}
          </Badge>
          <Badge variant="outline" className="flex items-center">
            <Award className="mr-1 h-3 w-3" /> Certificate
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {program.hasDiscounted && program.discountedPrice ? (
              <div>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(program.discountedPrice)}</span>
                <span className="text-sm text-gray-500 line-through ml-2">{formatCurrency(program.price)}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(program.price)}</span>
            )}
            <span className="text-sm text-gray-500 block">Complete program</span>
          </div>
          <Link href={`/specialist-programs/${program.id}`}>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-md">
              View Program <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SpecialistProgramCard;