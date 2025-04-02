import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const PopularPrograms = () => {
  const multimediaFeatures = [
    "Master graphic design with Adobe Photoshop and Illustrator",
    "Create and edit professional videos with Premiere Pro",
    "Professional photo retouching and enhancement techniques",
    "Mobile video editing with Capcut for social media content"
  ];

  const diplomaFeatures = [
    "Strong foundation in programming and computer science theory",
    "Database management and system analysis",
    "Web and mobile application development",
    "Recognized qualification for university admission"
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter text-gray-900">Our Popular Programs</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our most demanded courses and diploma programs designed to meet industry needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Multimedia Group Course */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 font-inter">Multimedia Group Course</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-dark text-white">
                  Best Value
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                Complete package including Adobe Photoshop, Illustrator, Premiere Pro, Capcut, and Photoshop Retouching at a discounted price.
              </p>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">What you'll learn:</h4>
                <ul className="space-y-2">
                  {multimediaFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="text-success mt-1 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <p className="text-gray-500 text-sm line-through">$500 separately</p>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(380)}</span>
                    <span className="ml-2 text-sm text-success font-medium">Save 24%</span>
                  </div>
                </div>
                <Link href="/courses?type=multimedia">
                  <a className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                    Enroll Now
                  </a>
                </Link>
              </div>
            </div>
          </div>

          {/* Diploma in Computer Science */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 font-inter">Diploma in Computer Science</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-white">
                  University Pathway
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                Comprehensive diploma program that provides a pathway to bachelor's degrees at partner universities including Bosaso, East Africa, and Frontier University.
              </p>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Program highlights:</h4>
                <ul className="space-y-2">
                  {diplomaFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="text-success mt-1 mr-2 h-5 w-5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <div>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(1800)}</span>
                    <span className="ml-2 text-sm text-gray-500 font-medium">/ 18 months</span>
                  </div>
                  <p className="text-sm text-gray-500">Installment plans available</p>
                </div>
                <Link href="/courses?type=diploma">
                  <a className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                    Learn More
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularPrograms;
