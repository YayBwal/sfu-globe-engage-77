import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, password: string, name: string, studentId: string, major: string, batch: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

type UserProfile = {
  id: string;
  name: string;
  student_id: string;
  major: string;
  batch: string;
  email: string;
  online: boolean;
  bio: string;
  interests: string[];
  availability: string;
  profilePic: string | null;
  coverPic: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
    }

    session()

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
          }

          setProfile(profileData as UserProfile);
          setIsAuthenticated(true);
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

  const register = async (email: string, password: string, name: string, studentId: string, major: string, batch: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            student_id: studentId,
            major,
            batch,
          }
        }
      });

      if (error) {
        throw error;
      }

      // After successful registration, navigate to profile setup or home
      navigate('/profile');
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      // Handle registration error (e.g., display error message)
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      // After successful login, navigate to home
      navigate('/');
    } catch (error: any) {
      console.error("Login failed:", error.message);
      // Handle login error (e.g., display error message)
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      // After successful logout, navigate to login page
      navigate('/login');
    } catch (error: any) {
      console.error("Logout failed:", error.message);
      // Handle logout error (e.g., display error message)
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

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as UserProfile);
    } catch (error: any) {
      console.error("Profile update failed:", error.message);
      // Handle update error (e.g., display error message)
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated,
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
