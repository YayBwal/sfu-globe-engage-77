
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Index from '@/pages/Index';
import Study from '@/pages/Study';
import Clubs from '@/pages/Clubs';
import Quizzes from '@/pages/Quizzes';
import Leaderboard from '@/pages/Leaderboard';
import MinorGames from '@/pages/MinorGames';
import Attendance from '@/pages/Attendance';
import NotFound from '@/pages/NotFound';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Marketplace from '@/pages/Marketplace';
import Newsfeed from '@/pages/Newsfeed';
import AIChatBubble from '@/components/AIChatBubble';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClubProvider } from '@/contexts/ClubContext';
import { supabase } from '@/integrations/supabase/client';

function App() {
  // Create storage buckets if they don't exist
  useEffect(() => {
    const createStorageBuckets = async () => {
      // Check if club-logos bucket exists and create it if it doesn't
      const { data: logoBucket, error: logoBucketError } = await supabase.storage.getBucket('club-logos');
      if (logoBucketError && logoBucketError.message.includes('The resource was not found')) {
        await supabase.storage.createBucket('club-logos', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
        });
      }
      
      // Check if club-images bucket exists and create it if it doesn't
      const { data: imagesBucket, error: imagesBucketError } = await supabase.storage.getBucket('club-images');
      if (imagesBucketError && imagesBucketError.message.includes('The resource was not found')) {
        await supabase.storage.createBucket('club-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
        });
      }
      
      // Check if profile-images bucket exists and create it if it doesn't
      const { data: profileBucket, error: profileBucketError } = await supabase.storage.getBucket('profile-images');
      if (profileBucketError && profileBucketError.message.includes('The resource was not found')) {
        await supabase.storage.createBucket('profile-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
        });
      }
    };
    
    createStorageBuckets();
  }, []);
  
  // OpenAI API key for the AI chat assistant
  const aiApiKey = "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";
  
  return (
    <Router>
      <AuthProvider>
        <ClubProvider>
          <div className="app">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/study" element={<Study />} />
              <Route path="/clubs/*" element={<Clubs />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/games" element={<MinorGames />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/newsfeed" element={<Newsfeed />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <AIChatBubble apiKey={aiApiKey} />
          </div>
        </ClubProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
