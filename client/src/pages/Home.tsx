import HeroSection from "@/components/home/HeroSection";
import CourseCategories from "@/components/home/CourseCategories";
import FeatureHighlights from "@/components/home/FeatureHighlights";
import PopularPrograms from "@/components/home/PopularPrograms";
import CertificateVerification from "@/components/home/CertificateVerification";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";

const Home = () => {
  return (
    <>
      <HeroSection />
      <CourseCategories />
      <FeatureHighlights />
      <PopularPrograms />
      <CertificateVerification />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default Home;
