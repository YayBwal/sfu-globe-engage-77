
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LeaderboardSection from "@/components/gaming/LeaderboardSection";
import QuizSection from "@/components/gaming/QuizSection";
import GamesSection from "@/components/gaming/GamesSection";
import { GamingProvider } from "@/contexts/GamingContext";
import { Trophy, BookOpen, Gamepad, BookOpenCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GamingHub = () => {
  const [activeTab, setActiveTab] = useState("games");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  
  // Force-fetch context data when component mounts
  useEffect(() => {
    // This will ensure the data is fetched when the component loads
    const fetchInitialData = async () => {
      // We'll use a small delay to ensure the context is initialized
      setTimeout(() => {
        const tabsToPreload = document.querySelectorAll('[role="tab"]');
        tabsToPreload.forEach((tab) => {
          // Simulate a click to ensure data loading triggers in each tab
          if (tab instanceof HTMLElement) {
            tab.click();
          }
        });
        // Set back to the default tab
        setActiveTab("games");
      }, 100);
    };
    
    fetchInitialData();
  }, []);

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
  };

  // Sample course data - this would ideally come from an API
  const courses = [
    { id: "dc", name: "Diploma in Computing (DC)" },
    { id: "dcbm", name: "Diploma in Computing & Business Management (DCBM)" },
    { id: "bm", name: "Business Management (BM)" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sfu-lightgray/30">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 text-gradient-red">
              S1st Gaming Hub
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Compete in quizzes, play games, and climb the leaderboard in one seamless experience.
            </p>
            
            <div className="max-w-xs mx-auto">
              <div className="flex items-center gap-2">
                <BookOpenCheck size={20} className="text-sfu-red" />
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <GamingProvider>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
              defaultValue="games"
            >
              <div className="flex justify-center mb-8">
                <TabsList className="bg-white/50 backdrop-blur-sm shadow-sm border border-gray-100 p-1 rounded-full">
                  <TabsTrigger 
                    value="games" 
                    className="data-[state=active]:bg-sfu-red data-[state=active]:text-white rounded-full px-6 py-2 gap-2"
                  >
                    <Gamepad size={18} />
                    <span className="hidden sm:inline">Games</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="quiz" 
                    className="data-[state=active]:bg-sfu-red data-[state=active]:text-white rounded-full px-6 py-2 gap-2"
                  >
                    <BookOpen size={18} />
                    <span className="hidden sm:inline">Quizzes</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leaderboard" 
                    className="data-[state=active]:bg-sfu-red data-[state=active]:text-white rounded-full px-6 py-2 gap-2"
                  >
                    <Trophy size={18} />
                    <span className="hidden sm:inline">Leaderboard</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab + selectedCourse}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabVariants}
                  >
                    <TabsContent value="games" className="mt-0">
                      <GamesSection courseId={selectedCourse !== "all" ? selectedCourse : undefined} />
                    </TabsContent>
                    
                    <TabsContent value="quiz" className="mt-0">
                      <QuizSection courseId={selectedCourse !== "all" ? selectedCourse : undefined} />
                    </TabsContent>
                    
                    <TabsContent value="leaderboard" className="mt-0">
                      <LeaderboardSection />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </GamingProvider>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GamingHub;
