import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import SolarCalculator from "@/components/solar-calculator";
import ServicesOverview from "@/components/services-overview";
import WhyChooseUs from "@/components/why-choose-us";
import Testimonials from "@/components/testimonials";
import SolarRepOpportunity from "@/components/solar-rep-opportunity";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";
import QualificationModal from "@/components/qualification-modal";
import ExitIntentModal from "@/components/exit-intent-modal";

export default function Home() {
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [showExitIntentModal, setShowExitIntentModal] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownExitIntent) {
        setHasShownExitIntent(true);
        setShowExitIntentModal(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShownExitIntent]);

  const handleOpenQualification = () => {
    setShowQualificationModal(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onOpenQualification={handleOpenQualification} />
      <HeroSection 
        onOpenQualification={handleOpenQualification}
        onScrollToCalculator={() => scrollToSection('calculator')}
      />
      <HowItWorks />
      <SolarCalculator />
      <ServicesOverview />
      <WhyChooseUs onOpenQualification={handleOpenQualification} />
      <Testimonials />
      <SolarRepOpportunity />
      <ContactSection />
      <Footer />
      
      <QualificationModal 
        isOpen={showQualificationModal}
        onClose={() => setShowQualificationModal(false)}
      />
      
      <ExitIntentModal 
        isOpen={showExitIntentModal}
        onClose={() => setShowExitIntentModal(false)}
        onContinue={handleOpenQualification}
      />
    </div>
  );
}
