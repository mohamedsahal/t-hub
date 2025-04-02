import { ArrowRight, Code, GraduationCap, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Import the THub logo
import logoPath from "@assets/FB_IMG_1743600608616.png";

// App logos for animation
const appLogos = [
  { name: "Photoshop", color: "#31A8FF" },
  { name: "Illustrator", color: "#FF9A00" },
  { name: "Premiere Pro", color: "#9999FF" },
  { name: "Capcut", color: "#00FFA3" },
  { name: "QuickBooks", color: "#2CA01C" },
  { name: "Odoo", color: "#714B67" },
  { name: "Excel", color: "#217346" },
  { name: "Word", color: "#2B579A" }
];

// Stats for the hero section
const stats = [
  { value: "1,200+", label: "Graduates" },
  { value: "15+", label: "Professional Courses" },
  { value: "20+", label: "Expert Instructors" },
  { value: "95%", label: "Employment Rate" }
];

// Course roadmap steps
const roadmapSteps = [
  { number: "01", text: "Browse our course catalog" },
  { number: "02", text: "Choose a course that fits your goals" },
  { number: "03", text: "Register & select payment option" },
  { number: "04", text: "Start learning & building your future" }
];

// Code snippet to display in the window
const codeSnippet = `// THub Innovation Learning Path
class CareerSuccess {
  constructor() {
    this.skills = [];
    this.credentials = [];
    this.careerOpportunities = [];
  }

  enrollCourse(courseName) {
    console.log(\`Enrolled in \${courseName}\`);
    this.skills.push(courseName);
    return this;
  }

  completeCertification() {
    this.credentials.push("THub Certification");
    return this;
  }

  applyForJobs() {
    this.careerOpportunities = [
      "Digital Marketing Specialist",
      "Graphic Designer", 
      "Web Developer",
      "Accounting Professional"
    ];
    return this;
  }
}

// Start your journey today
const myCareer = new CareerSuccess();
myCareer
  .enrollCourse("Multimedia Design")
  .completeCertification()
  .applyForJobs();`;

// Animated logo component
const AnimatedLogo = ({ name, color }: { name: string; color: string }) => {
  return (
    <motion.div 
      className="flex items-center shadow-sm bg-white/90 px-3 py-2 rounded-full absolute"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        boxShadow: `0 2px 10px ${color}40`,
        border: `1px solid ${color}30`,
      }}
    >
      <div 
        className="w-3 h-3 rounded-full mr-2" 
        style={{ backgroundColor: color }}
      ></div>
      <span className="text-xs font-medium">{name}</span>
    </motion.div>
  );
};

// Mac window component for code snippet
const MacWindow = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-xl border border-gray-200 bg-white w-full max-w-xl mx-auto">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-500 mx-auto">learn-to-code.js</div>
      </div>
      <div className="bg-gray-900 p-4 overflow-auto max-h-80 text-sm">
        <pre className="text-green-400 font-mono">{children}</pre>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Gradient background using THub colors (blue #0080c9 and green #3cb878) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0080c9]/10 via-white to-[#3cb878]/10 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div>
            <div className="flex items-center mb-6">
              <img src={logoPath} alt="THub Logo" className="h-14 mr-4" />
              <div className="bg-gradient-to-r from-[#3cb878] to-[#0080c9] text-white text-xs px-3 py-1 rounded-full">
                Innovation Center
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-inter">
              <span className="bg-gradient-to-r from-[#3cb878] to-[#0080c9] text-transparent bg-clip-text">
                Transform Your Skills
              </span>
              <br />with Expert-Led Courses
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              From short programs to professional diplomas, we offer flexible learning options 
              to help you achieve your career goals in multimedia, accounting, marketing, and development.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-[#3cb878] to-[#0080c9] hover:from-[#359e6a] hover:to-[#0070b3]">
                <Link href="/courses">
                  Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/verify-certificate">Verify Certificate</Link>
              </Button>
            </div>
          </div>
          
          {/* Right side - Code window and animated elements */}
          <div className="relative">
            {/* Mac-style window with code */}
            <MacWindow>
              {codeSnippet}
            </MacWindow>
            
            {/* Animated app logos positioned around */}
            {mounted && appLogos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  x: Math.sin(index * 1.5) * 40,
                  top: 80 + (index * 35) % 280,
                  right: ((index * 30) % 100) - 40,
                  zIndex: 10 - (index % 10)
                }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="absolute"
                style={{ 
                  display: index < 8 ? 'block' : 'none'
                }}
              >
                <AnimatedLogo name={logo.name} color={logo.color} />
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Roadmap section */}
        <div className="mt-16 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
            <GraduationCap className="mr-2 h-6 w-6 text-primary" />
            Your Learning Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roadmapSteps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="relative flex flex-col items-center p-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-3">
                  {step.number}
                </div>
                <p className="text-center text-gray-700">{step.text}</p>
                {index < roadmapSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-5 top-10 text-gray-300 h-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
