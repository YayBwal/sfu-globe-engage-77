
import React, { useEffect, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(() => {
    if (!parallaxRef.current) return;
    const scrollPos = window.scrollY;
    const translateY = scrollPos * 0.3;
    const opacity = Math.max(0, 1 - scrollPos * 0.002);
    
    parallaxRef.current.style.transform = `translateY(${translateY}px)`;
    parallaxRef.current.style.opacity = `${opacity}`;
  }, []);
  
  useEffect(() => {
    let ticking = false;
    
    const optimizedHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', optimizedHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', optimizedHandleScroll);
  }, [handleScroll]);

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center pt-20 pb-10 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-sfu-lightgray -z-10"></div>
      
      {/* Simplified decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-sfu-red/5"></div>
      <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-sfu-red/10"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-sfu-red/5"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10" ref={parallaxRef}>
        <div className="inline-block mb-6">
          <span className="pill bg-sfu-red/10 text-sfu-red">Your Global College Community</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
          Connect, Learn, and<br />Grow with <span className="text-sfu-red">S1st Globe</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
          Discover a modern platform designed to enhance your academic journey through interactive
          learning, community engagement, and gamified experiences.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-3 rounded-lg bg-sfu-red text-white font-medium hover:bg-sfu-red/90 transition-all duration-300 flex items-center gap-2 shadow-sm">
            Get Started <ArrowRight size={16} />
          </button>
          <button className="px-8 py-3 rounded-lg bg-transparent text-sfu-black font-medium hover:bg-sfu-lightgray transition-all duration-300 flex items-center gap-2">
            Learn More
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <a 
          href="#features" 
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center animate-pulse text-gray-400"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
