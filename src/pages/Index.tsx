
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CTASection from "@/components/home/CTASection";
import HomeResourcesSection from "@/components/home/HomeResourcesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <HeroSection />
        <HomeResourcesSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
