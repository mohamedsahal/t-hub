import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white font-inter">Ready to Advance Your Career?</h2>
          <p className="mt-4 text-xl text-white opacity-90 max-w-3xl mx-auto">
            Join thousands of students who have transformed their careers with our professional courses.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/courses">
              <Button size="lg" className="px-8 bg-white hover:bg-gray-100 text-primary font-semibold shadow-md">
                Browse All Courses
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="px-8 bg-gradient-to-r from-[#3cb878] to-[#0080c9] hover:from-[#359e6a] hover:to-[#0070b3] text-white font-semibold shadow-md">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
