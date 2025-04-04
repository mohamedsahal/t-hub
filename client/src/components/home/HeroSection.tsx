import { useState } from "react";
import { ArrowRight, GraduationCap, BookOpen, Layers, Database, Server } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// App logos for animation - Design & Multimedia tools + MERN stack
const appLogos = [
  // Design Tools
  { name: "Photoshop", color: "#31A8FF", category: "design" },
  { name: "Illustrator", color: "#FF9A00", category: "design" },
  { name: "Premiere Pro", color: "#9999FF", category: "design" },
  { name: "Capcut", color: "#00FFA3", category: "design" },
  
  // Business Tools
  { name: "QuickBooks", color: "#2CA01C", category: "business" },
  { name: "Odoo", color: "#714B67", category: "business" },
  { name: "Excel", color: "#217346", category: "business" },
  { name: "Word", color: "#2B579A", category: "business" },
  
  // MERN Stack
  { name: "MongoDB", color: "#4DB33D", category: "mern" },
  { name: "Express", color: "#000000", category: "mern" },
  { name: "React", color: "#61DAFB", category: "mern" },
  { name: "Node.js", color: "#68A063", category: "mern" },
  
  // Additional Development Tools
  { name: "JavaScript", color: "#F7DF1E", category: "dev" },
  { name: "Python", color: "#3776AB", category: "dev" },
  { name: "HTML5", color: "#E34F26", category: "dev" },
  { name: "CSS3", color: "#1572B6", category: "dev" }
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

// Tech stack items for visualization
const techStacks = [
  { 
    title: "Design & Multimedia", 
    iconType: "Layers",
    iconColor: "text-[#FF9A00]",
    color: "from-[#FF9A00]/20 to-[#31A8FF]/20"
  },
  { 
    title: "Business & Accounting", 
    iconType: "BookOpen",
    iconColor: "text-[#2CA01C]",
    color: "from-[#2CA01C]/20 to-[#217346]/20"
  },
  { 
    title: "Web Development", 
    iconType: "Server",
    iconColor: "text-[#61DAFB]",
    color: "from-[#4DB33D]/20 to-[#61DAFB]/20"
  },
  { 
    title: "Digital Marketing", 
    iconType: "Database",
    iconColor: "text-[#0080c9]",
    color: "from-[#0080c9]/20 to-[#3cb878]/20"
  }
];



const HeroSection = ({ hasAlert = false }: { hasAlert?: boolean }) => {

  return (
    <section className={`relative ${hasAlert ? 'pt-10' : 'pt-8'} pb-16 md:pb-20 overflow-hidden`}>
      {/* Gradient background using THub colors (blue #0080c9 and green #3cb878) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0080c9]/10 via-white to-[#3cb878]/10 z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div>
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
              <Button variant="outline" size="lg" asChild className="border-primary text-primary hover:bg-primary/10 font-semibold">
                <Link href="/verify-certificate">Verify Certificate</Link>
              </Button>
            </div>
          </div>
          
          {/* Right side - Learning Path Visualization */}
          <div className="relative h-auto md:h-auto bg-white/40 rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4 sm:p-6">
            <motion.h3 
              className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GraduationCap className="mr-2 h-6 w-6 text-primary" />
              Your Learning Journey
            </motion.h3>
            
            {/* Learning paths visualization */}
            <div className="space-y-6">
              {techStacks.map((stack, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-gradient-to-r ${stack.color} p-4 rounded-lg shadow-sm`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 rounded-full bg-white/80 p-2">
                      {stack.iconType === "Layers" && <Layers className={`h-6 w-6 ${stack.iconColor}`} />}
                      {stack.iconType === "BookOpen" && <BookOpen className={`h-6 w-6 ${stack.iconColor}`} />}
                      {stack.iconType === "Server" && <Server className={`h-6 w-6 ${stack.iconColor}`} />}
                      {stack.iconType === "Database" && <Database className={`h-6 w-6 ${stack.iconColor}`} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{stack.title}</h3>
                      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full bg-white"
                          initial={{ width: 0 }}
                          animate={{ width: `${(index + 1) * 25}%` }}
                          transition={{ delay: 0.3 + (index * 0.1), duration: 0.8 }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-700 flex justify-between">
                        <span>Beginner</span>
                        <span>Professional</span>
                      </div>
                      <motion.div 
                        className="mt-2 flex flex-wrap gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + (index * 0.1) }}
                      >
                        {appLogos
                          .filter(logo => {
                            if (stack.iconType === "Layers" && logo.category === "design") return true;
                            if (stack.iconType === "BookOpen" && logo.category === "business") return true;
                            if (stack.iconType === "Server" && (logo.category === "mern" || logo.category === "dev")) return true;
                            if (stack.iconType === "Database" && logo.category === "mern") return true;
                            return false;
                          })
                          .slice(0, 3)
                          .map((logo, i) => (
                            <span 
                              key={i} 
                              className="text-xs px-2 py-1 rounded-full bg-white/80 flex items-center"
                              style={{ border: `1px solid ${logo.color}30` }}
                            >
                              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: logo.color }}></span>
                              {logo.name}
                            </span>
                          ))
                        }
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
