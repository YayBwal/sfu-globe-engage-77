import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, UserProfile } from '@/types/auth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUserProfile, updateUserProfile } from '@/services/profileService';
import { registerUser, loginUser, logoutUser, deleteAccount } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: sessionLoading, connectionError } = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Effect to handle connection errors
  useEffect(() => {
    if (connectionError) {
      toast({
        title: "Connection Error",
        description: connectionError.message,
        variant: "destructive",
      });
    }
  }, [connectionError]);

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
      
      // Check if it's a network connection error and show a toast
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to load your profile. Please check your internet connection.",
          variant: "destructive",
        });
      }
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
      
      // Enhanced error message for network issues
      let errorMsg = error.message;
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMsg = "Network error. Please check your internet connection and try again.";
      }
      
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      await loginUser(identifier, password);
      
      // Navigate to home directly since loginUser already checks approval status
      navigate('/');
      
      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
      });
    } catch (error: any) {
      console.error("Login failed:", error.message);
      
      // Enhanced error handling with more specific error messages
      let errorMsg = error.message;
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMsg = "Network error. Please check your internet connection and try again.";
      }
      
      throw new Error(errorMsg);
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
    register: registerUser,
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
