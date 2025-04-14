import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, UserProfile } from '@/types/auth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { registerUser, loginUser, logoutUser, deleteAccount } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: sessionLoading } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Memoize profile fetching to prevent unnecessary re-renders
  const getProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const profileData = await fetchUserProfile(user.id);
      
      if (profileData) {
        // Only update state if the profile data has changed
        const profileChanged = JSON.stringify(profileData) !== JSON.stringify(profile);
        if (profileChanged) {
          setProfile(profileData);
          setIsAuthenticated(true);
          
          // Check if user is admin
          await checkAdminStatus();
          
          // Update online status when user logs in
          if (profileData.online === false) {
            await updateUserProfile(user.id, { online: true });
          }
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
  }, [user, profile]);

  useEffect(() => {
    setLoading(true);
    getProfile();
  }, [user, getProfile]);

  // Memoize admin status check to prevent re-renders
  const checkAdminStatus = useCallback(async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }
      
      // Only update if changed
      if (data !== isAdmin) {
        setIsAdmin(data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, [user, isAdmin]);

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

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      await loginUser(identifier, password);
      
      // Special case for admin - check directly rather than waiting for profile fetch
      if (identifier === '2024D5764' || identifier === 'Yan Naing Aung') {
        setIsAdmin(true);
      }
      
      // Navigate to home directly since loginUser already checks approval status
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
      setIsAdmin(false);
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

  // Add theme preference handling
  const [theme, setTheme] = useState<string>(profile?.theme_preference || 'light');

  useEffect(() => {
    if (profile?.theme_preference) {
      setTheme(profile.theme_preference);
    }
  }, [profile]);

  const updateTheme = async (newTheme: string) => {
    try {
      if (!user) {
        throw new Error("No user logged in");
      }

      await updateUserProfile(user.id, { theme_preference: newTheme });
      setTheme(newTheme);
    } catch (error) {
      console.error("Theme update failed:", error);
      throw error;
    }
  };

  const deleteUserAccount = async () => {
    try {
      if (!user) {
        throw new Error("No user logged in");
      }

      await deleteAccount(user.id);
      
      // Log out after account deletion
      logout();
    } catch (error) {
      console.error("Account deletion failed:", error);
      throw error;
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
    theme,
    updateTheme,
    deleteUserAccount,
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
