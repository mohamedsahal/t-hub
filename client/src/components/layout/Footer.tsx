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
    <footer className="bg-neutral-dark text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold mb-4">
              <span className="text-primary">T</span>hub Innovation
            </div>
            <p className="text-gray-300 mb-4">
              Providing quality education and professional skills training to help students achieve their career goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-300 hover:text-white">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-gray-300 hover:text-white">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/courses">
                  <a className="text-gray-300 hover:text-white">Courses</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=diploma">
                  <a className="text-gray-300 hover:text-white">Diploma Programs</a>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <a className="text-gray-300 hover:text-white">Student Login</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Our Courses</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/courses?type=multimedia">
                  <a className="text-gray-300 hover:text-white">Multimedia Design</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=accounting">
                  <a className="text-gray-300 hover:text-white">Computerized Accounting</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=marketing">
                  <a className="text-gray-300 hover:text-white">Digital Marketing</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=development">
                  <a className="text-gray-300 hover:text-white">Web Development</a>
                </Link>
              </li>
              <li>
                <Link href="/courses?type=diploma">
                  <a className="text-gray-300 hover:text-white">Diploma Programs</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Mail className="mt-1 mr-2 text-primary" size={16} />
                <span>info@t-hub.so</span>
              </li>
              <li className="flex items-start">
                <FaWhatsapp className="mt-1 mr-2 text-primary" size={16} />
                <span>+2525251111</span>
              </li>
              <li className="flex items-start">
                <MapPin className="mt-1 mr-2 text-primary" size={16} />
                <span>Bosaso, Somalia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300">
            &copy; {year} Thub Innovation. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-300 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
