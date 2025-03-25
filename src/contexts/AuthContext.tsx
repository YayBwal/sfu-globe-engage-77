
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  profile_pic?: string | null; // For compatibility with DB
  cover_pic?: string | null; // For compatibility with DB
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

          if (profileData) {
            // Map database fields to our UserProfile type
            const mappedProfile: UserProfile = {
              id: profileData.id,
              name: profileData.name,
              student_id: profileData.student_id,
              major: profileData.major,
              batch: profileData.batch,
              email: profileData.email,
              online: profileData.online,
              bio: profileData.bio || "",
              interests: profileData.interests || [],
              availability: profileData.availability || "",
              profilePic: profileData.profile_pic,
              coverPic: profileData.cover_pic,
              // Keep original DB fields for compatibility
              profile_pic: profileData.profile_pic,
              cover_pic: profileData.cover_pic
            };
            
            setProfile(mappedProfile);
            setIsAuthenticated(true);
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
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created successfully.",
      });
      
      // After successful registration, navigate to profile setup or home
      navigate('/profile');
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      // Error is already handled above
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
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });

      // After successful login, navigate to home
      navigate('/');
    } catch (error: any) {
      console.error("Login failed:", error.message);
      // Error is already handled above
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      // After successful logout, navigate to login page
      navigate('/login');
    } catch (error: any) {
      console.error("Logout failed:", error.message);
      // Error is already handled above
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setLoading(true);
    try {
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "You need to be logged in to update your profile.",
          variant: "destructive",
        });
        throw new Error("No user logged in");
      }

      // Convert from our UserProfile type to database field names if needed
      const dbUpdates: any = { ...updates };
      if ('profilePic' in updates) {
        dbUpdates.profile_pic = updates.profilePic;
        delete dbUpdates.profilePic;
      }
      if ('coverPic' in updates) {
        dbUpdates.cover_pic = updates.coverPic;
        delete dbUpdates.coverPic;
      }
      if ('student_id' in updates) {
        dbUpdates.student_id = updates.student_id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (data) {
        // Map DB fields back to our UserProfile type
        const updatedProfile: UserProfile = {
          id: data.id,
          name: data.name,
          student_id: data.student_id,
          major: data.major,
          batch: data.batch,
          email: data.email,
          online: data.online,
          bio: data.bio || "",
          interests: data.interests || [],
          availability: data.availability || "",
          profilePic: data.profile_pic,
          coverPic: data.cover_pic,
          profile_pic: data.profile_pic,
          cover_pic: data.cover_pic
        };
        
        setProfile(updatedProfile);

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error: any) {
      console.error("Profile update failed:", error.message);
      // Error is already handled above
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
