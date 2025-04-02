import { Link } from "wouter";

const HeroSection = () => {
  return (
    <section className="relative bg-primary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <h1 className="text-3xl md:text-4xl font-bold font-inter mb-4">
              Accelerate Your Career with Professional Skills
            </h1>
            <p className="text-lg mb-8 max-w-lg">
              Join Thub Innovation's specialized courses in multimedia, accounting, marketing, and web development to advance your career path.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/courses">
                <a className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                  Explore Courses
                </a>
              </Link>
              <Link href="/courses?type=diploma">
                <a className="inline-flex justify-center items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-white hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                  View Diploma Programs
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1052&q=80" 
              alt="Students learning with laptop" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#F3F4F6" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
