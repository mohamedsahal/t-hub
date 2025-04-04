import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import HeroSection from "@/components/home/HeroSection";
import CourseCategories from "@/components/home/CourseCategories";
import FeatureHighlights from "@/components/home/FeatureHighlights";
import ProgramCategories from "@/components/home/PopularPrograms";
import CertificateVerification from "@/components/home/CertificateVerification";
import Testimonials from "@/components/home/Testimonials";
import SaasProducts from "@/components/home/SaasProducts";
import Partners from "@/components/home/Partners";
import RecentEvents from "@/components/home/RecentEvents";
import CallToAction from "@/components/home/CallToAction";
import AlertBanner from "@/components/ui/AlertBanner";

// Alert type for TypeScript
interface Alert {
  id: number;
  title: string;
  content: string;
  type: string;
  buttonText?: string | null;
  buttonLink?: string | null;
}

const Home = () => {
  // Fetch active alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts/active'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Get alerts that haven't been dismissed
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>(() => {
    const saved = localStorage.getItem('dismissedAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  const hasAlerts = visibleAlerts.length > 0;

  return (
    <>
      <HeroSection hasAlert={hasAlerts} />
      <CourseCategories />
      <FeatureHighlights />
      <ProgramCategories />
      <SaasProducts />
      <Partners />
      <RecentEvents />
      <CertificateVerification />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default Home;
