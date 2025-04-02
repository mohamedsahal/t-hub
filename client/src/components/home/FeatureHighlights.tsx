import { 
  Users, 
  Laptop, 
  CreditCard, 
  Award 
} from "lucide-react";

const FeatureHighlights = () => {
  const features = [
    {
      icon: <Users />,
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of practical experience."
    },
    {
      icon: <Laptop />,
      title: "Hands-on Projects",
      description: "Build your portfolio with real-world projects and case studies."
    },
    {
      icon: <CreditCard />,
      title: "Flexible Payments",
      description: "Choose one-time payment or installment plans to fit your budget."
    },
    {
      icon: <Award />,
      title: "Recognized Certification",
      description: "Receive certificates recognized by industry partners and universities."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-inter text-gray-900">Why Choose Thub Innovation</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            We provide quality education with industry-standard practices to prepare you for the real world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-neutral-light rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
