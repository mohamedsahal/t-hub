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

const Home = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AlertBanner />
      </div>
      <HeroSection />
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
