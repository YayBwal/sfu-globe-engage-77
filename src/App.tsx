import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Index from '@/pages/Index';
import Study from '@/pages/Study';
import Clubs from '@/pages/Clubs';
import Attendance from '@/pages/Attendance';
import NotFound from '@/pages/NotFound';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import UpdatePassword from '@/pages/UpdatePassword';
import Profile from '@/pages/Profile';
import Marketplace from '@/pages/Marketplace';
import Newsfeed from '@/pages/Newsfeed';
import Friends from '@/pages/Friends';
import GamingHub from '@/pages/gaming/GamingHub';
import QuizHub from '@/pages/gaming/QuizHub';
import GamesHub from '@/pages/gaming/GamesHub';
import Leaderboard from '@/pages/gaming/Leaderboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClubProvider } from '@/contexts/ClubContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AttendanceProvider } from '@/contexts/AttendanceContext';
import { supabase } from '@/integrations/supabase/client';
import { setupStorageBuckets, setupStorage } from '@/utils/storageSetup';
import { usePresence } from '@/hooks/usePresence';
import { ChatBubble } from '@/components/ai-chat/ChatBubble';
import AdminReview from '@/pages/AdminReview';

// Presence wrapper component to use the hook with the router
const PresenceWrapper = ({ children }: { children: React.ReactNode }) => {
  usePresence();
  return <>{children}</>;
};

function App() {
  // Create storage buckets if they don't exist
  useEffect(() => {
    const initStorage = async () => {
      const success = await setupStorage();
      if (!success) {
        console.error("Failed to initialize storage buckets. Some features may not work properly.");
      }
    };
    
    initStorage();
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <ClubProvider>
            <AttendanceProvider>
              <PresenceWrapper>
                <div className="app">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/study" element={<Study />} />
                    <Route path="/clubs/*" element={<Clubs />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/newsfeed" element={<Newsfeed />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/admin/review" element={<AdminReview />} />
                    
                    {/* Gaming Hub Routes */}
                    <Route path="/gaming" element={<GamingHub />} />
                    <Route path="/gaming/quiz" element={<QuizHub />} />
                    <Route path="/gaming/quiz/:id" element={<QuizHub />} />
                    <Route path="/gaming/games" element={<GamesHub />} />
                    <Route path="/gaming/games/:id" element={<GamesHub />} />
                    <Route path="/gaming/leaderboard" element={<Leaderboard />} />
                    
                    <Route path="/not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                  </Routes>
                  <Toaster />
                  <ChatBubble />
                </div>
              </PresenceWrapper>
            </AttendanceProvider>
          </ClubProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
