import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CreditCard, 
  School, 
  Award, 
  MessageSquare, 
  ShoppingBag, 
  Building, 
  FileText, 
  Calendar, 
  Settings,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThubLogo from "@/components/ui/ThubLogo";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, href, isActive, onClick }: SidebarItemProps) => {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-gray-800/50",
        isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white"
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

interface SidebarCategoryProps {
  label: string;
  children: React.ReactNode;
}

const SidebarCategory = ({ label, children }: SidebarCategoryProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white"
      >
        <span>{label}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform", 
            isOpen && "transform rotate-180"
          )} 
        />
      </button>
      <div className={cn("space-y-1 mt-1", !isOpen && "hidden")}>
        {children}
      </div>
    </div>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      // After successful logout, redirect to login page
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 flex items-center justify-between h-16 px-4 lg:px-6 shadow-md">
        <div className="flex items-center gap-2">
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2">
            <ThubLogo width={110} height={35} useDarkBg={true} />
            <span className="ml-1 text-purple-300">Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-300 hover:text-white text-sm">
            View Site
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name || 'Administrator'}</span>
                  <span className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/admin/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto fixed inset-y-0 top-16 z-10 lg:static transition-transform duration-300",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-4 pt-6 pb-2 border-b border-gray-800 flex justify-center">
            <ThubLogo width={100} height={32} useDarkBg={true} />
          </div>
          <nav className="p-4 space-y-6">
            <SidebarCategory label="GENERAL">
              <SidebarItem 
                icon={<LayoutDashboard size={18} />} 
                label="Dashboard" 
                href="/admin" 
                isActive={location === "/admin"} 
              />
              <SidebarItem 
                icon={<Users size={18} />} 
                label="Users" 
                href="/admin/users" 
                isActive={location === "/admin/users"} 
              />
            </SidebarCategory>
            
            <SidebarCategory label="EDUCATION">
              <div className="relative group">
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-gray-800/50 cursor-pointer",
                    (location === "/admin/courses" || 
                     location === "/admin/courses/short" || 
                     location === "/admin/courses/specialist" || 
                     location === "/admin/courses/bootcamp" || 
                     location === "/admin/courses/diploma" || 
                     location.startsWith("/admin/course-builder")) 
                      ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white"
                  )}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <span>Courses</span>
                  <ChevronDown size={14} className="ml-auto" />
                </div>
                <div className="hidden group-hover:block absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <Link 
                      href="/admin/courses" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      All Courses
                    </Link>
                    <Link 
                      href="/admin/courses/short" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Short Courses
                    </Link>
                    <Link 
                      href="/admin/courses/specialist" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Specialist Programs
                    </Link>
                    <Link 
                      href="/admin/courses/bootcamp" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Bootcamps
                    </Link>
                    <Link 
                      href="/admin/courses/diploma" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Diploma Programs
                    </Link>
                  </div>
                </div>
              </div>
              <SidebarItem 
                icon={<CreditCard size={18} />} 
                label="Payments" 
                href="/admin/payments" 
                isActive={location === "/admin/payments"} 
              />
              <SidebarItem 
                icon={<School size={18} />} 
                label="Enrollments" 
                href="/admin/enrollments" 
                isActive={location === "/admin/enrollments"} 
              />
              <SidebarItem 
                icon={<Award size={18} />} 
                label="Certificates" 
                href="/admin/certificates" 
                isActive={location === "/admin/certificates"} 
              />
              <SidebarItem 
                icon={<MessageSquare size={18} />} 
                label="Testimonials" 
                href="/admin/testimonials" 
                isActive={location === "/admin/testimonials"} 
              />
            </SidebarCategory>
            
            <SidebarCategory label="PRODUCTS">
              <SidebarItem 
                icon={<ShoppingBag size={18} />} 
                label="SaaS Products" 
                href="/admin/products" 
                isActive={location === "/admin/products"} 
              />
              <SidebarItem 
                icon={<Building size={18} />} 
                label="Partners" 
                href="/admin/partners" 
                isActive={location === "/admin/partners"} 
              />
            </SidebarCategory>
            
            <SidebarCategory label="CONTENT">
              <SidebarItem 
                icon={<FileText size={18} />} 
                label="Page Content" 
                href="/admin/content" 
                isActive={location === "/admin/content"} 
              />
              <SidebarItem 
                icon={<Calendar size={18} />} 
                label="Events" 
                href="/admin/events" 
                isActive={location === "/admin/events"} 
              />
            </SidebarCategory>
            
            <SidebarCategory label="SYSTEM">
              <SidebarItem 
                icon={<Settings size={18} />} 
                label="Settings" 
                href="/admin/settings" 
                isActive={location === "/admin/settings"} 
              />
              <SidebarItem 
                icon={<User size={18} />} 
                label="My Profile" 
                href="/admin/profile" 
                isActive={location === "/admin/profile"} 
              />
            </SidebarCategory>
          </nav>
        </aside>
        
        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-0 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-100 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}