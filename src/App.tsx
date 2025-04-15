import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import Quizzes from './pages/Quizzes';
import AdminDashboard from './pages/AdminDashboard';
import AccountSettings from './components/settings/AccountSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import ProfileUnified from './pages/ProfileUnified';

function App() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { toast } = useToast()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      toast({
        title: "Development Mode",
        description: "This is a development environment. Use with caution.",
      })
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verification" element={<EmailVerification />} />

          {/* Private Routes */}
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <ProfileUnified />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clubs"
            element={
              isAuthenticated ? (
                <Clubs />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/quizzes"
            element={
              isAuthenticated ? (
                <Quizzes />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <AccountSettings />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
