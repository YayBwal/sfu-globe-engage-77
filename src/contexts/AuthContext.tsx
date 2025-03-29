
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, UserProfile } from '@/types/auth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { registerUser, loginUser, logoutUser } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: sessionLoading } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        if (user) {
          const profileData = await fetchUserProfile(user.id);
          
          if (profileData) {
            setProfile(profileData);
            setIsAuthenticated(true);
            
            // Check if user is admin
            checkAdminStatus();
            
            // Update online status when user logs in
            if (profileData.online === false) {
              await updateUserProfile(user.id, { online: true });
            }
          } else {
            setProfile(null);
            setIsAuthenticated(false);
          }
        } else {
          setProfile(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    studentId: string, 
    major: string, 
    batch: string,
    studentIdPhoto?: string
  ) => {
    setLoading(true);
    try {
      await registerUser(email, password, name, studentId, major, batch, studentIdPhoto);
      // After successful registration, navigate to login
      navigate('/login');
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginUser(email, password);
      
      // After successful login, we need to check if the user's account is approved
      const profileData = await fetchUserProfile(user?.id || '');
      
      if (profileData && profileData.approval_status !== 'approved') {
        // If not approved, log them out and show a message
        await logoutUser();
        throw new Error('Your account is pending approval. Please check back later.');
      }
      
      // If approved, navigate to home
      navigate('/');
    } catch (error: any) {
      console.error("Login failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      // The user state will be updated by the auth state listener
      setProfile(null);
      setIsAuthenticated(false);
      // After successful logout, navigate to login page
      navigate('/login');
    } catch (error: any) {
      console.error("Logout failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("No user logged in");
      }

      const updatedProfile = await updateUserProfile(user.id, updates);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      console.error("Profile update failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading: loading || sessionLoading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
