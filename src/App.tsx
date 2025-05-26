
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { GuestProvider } from '@/contexts/GuestContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AttendanceProvider } from '@/contexts/AttendanceContext';
import { ClubProvider } from '@/contexts/ClubContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Newsfeed from '@/pages/Newsfeed';
import Study from '@/pages/Study';
import Clubs from '@/pages/Clubs';
import Marketplace from '@/pages/Marketplace';
import Friends from '@/pages/Friends';
import Attendance from '@/pages/Attendance';
import AdminReview from '@/pages/AdminReview';
import Leaderboard from '@/pages/Leaderboard';
import GamingHub from '@/pages/gaming/GamingHub';
import GamesHub from '@/pages/gaming/GamesHub';
import QuizHub from '@/pages/gaming/QuizHub';
import GameLeaderboard from '@/pages/gaming/Leaderboard';
import NotFound from '@/pages/NotFound';
import UpdatePassword from '@/pages/UpdatePassword';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { isGuest } = useGuest();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { isGuest } = useGuest();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated || isGuest) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Index />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/newsfeed" element={
        <ProtectedRoute>
          <Layout>
            <Newsfeed />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/study" element={
        <ProtectedRoute>
          <Layout>
            <Study />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/clubs" element={
        <ProtectedRoute>
          <Layout>
            <Clubs />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <Layout>
            <Marketplace />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/friends" element={
        <ProtectedRoute>
          <Layout>
            <Friends />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout>
            <Attendance />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/review" element={
        <ProtectedRoute>
          <Layout>
            <AdminReview />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <Leaderboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gaming" element={
        <ProtectedRoute>
          <Layout>
            <GamingHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gaming/games" element={
        <ProtectedRoute>
          <Layout>
            <GamesHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gaming/quiz" element={
        <ProtectedRoute>
          <Layout>
            <QuizHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gaming/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <GameLeaderboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <GuestProvider>
        <AuthProvider>
          <NotificationProvider>
            <AttendanceProvider>
              <ClubProvider>
                <AppContent />
                <Toaster />
              </ClubProvider>
            </AttendanceProvider>
          </NotificationProvider>
        </AuthProvider>
      </GuestProvider>
    </Router>
  );
}

export default App;
