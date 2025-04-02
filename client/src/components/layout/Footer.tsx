import { Link } from "wouter";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  MapPin 
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="relative text-white overflow-hidden">
      {/* Background with brand gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0080c9] to-[#3cb878] opacity-90 z-0"></div>
      
      {/* Decorative shapes */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#3cb878] to-[#0080c9] z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#0080c9]/20 z-0"></div>
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#3cb878]/20 z-0"></div>
      
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4 flex items-center">
              <img src="/attached_assets/FB_IMG_1743600608616.png" alt="THub Logo" className="h-8 w-auto mr-2" />
              <span className="text-white">Innovation</span>
            </div>
            <p className="text-white/90 mb-6">
              Providing quality education and professional skills training to help students achieve their career goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/courses">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Courses
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/verify-certificate">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Verify Certificate
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Student Login
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Our Courses</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/courses?type=multimedia">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Multimedia Design
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=accounting">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Computerized Accounting
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=marketing">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Digital Marketing
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=development">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Web Development
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=diploma">
                  <a className="text-white/80 hover:text-white transition-colors flex items-center">
                    <span className="bg-white/10 w-1.5 h-1.5 rounded-full mr-2"></span>
                    Diploma Programs
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <Mail className="text-white" size={16} />
                </div>
                <span className="text-white/90">info@t-hub.so</span>
              </li>
              <li className="flex items-center">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <FaWhatsapp className="text-white" size={16} />
                </div>
                <span className="text-white/90">+2525251111</span>
              </li>
              <li className="flex items-center">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <MapPin className="text-white" size={16} />
                </div>
                <span className="text-white/90">Bosaso, Somalia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/80">
            &copy; {year} Thub Innovation. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
