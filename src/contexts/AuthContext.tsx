
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  major: string;
  batch: string;
  profilePic?: string;
  bio?: string;
  interests?: string[];
  availability?: string;
  online?: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  register: (userData: Omit<UserProfile, "id"> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserStatus: (online: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);
        
        if (currentSession?.user) {
          fetchUserProfile(currentSession.user.id);
          updateUserStatus(true);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
        updateUserStatus(true);
      }
    });

    // Set offline status when user closes the tab/window
    window.addEventListener('beforeunload', () => {
      if (user) {
        updateUserStatus(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const userProfile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          studentId: data.student_id,
          major: data.major,
          batch: data.batch,
          bio: data.bio,
          interests: data.interests,
          availability: data.availability,
          online: data.online,
        };
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const login = async (studentId: string, password: string) => {
    try {
      // First, find the user email using the student ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('student_id', studentId)
        .single();

      if (profileError || !profileData) {
        throw new Error("Student ID not found");
      }

      // Then sign in with the email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const register = async (userData: Omit<UserProfile, "id"> & { password: string }) => {
    try {
      // Check if student ID already exists
      const { data: existingStudentId, error: studentIdError } = await supabase
        .from('profiles')
        .select('student_id')
        .eq('student_id', userData.studentId)
        .maybeSingle();

      if (!studentIdError && existingStudentId) {
        throw new Error("Student ID already registered");
      }

      // Sign up with email and password
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            studentId: userData.studentId,
            major: userData.major,
            batch: userData.batch,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // The user profile will be created automatically by the database trigger

      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (online: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ online })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating user status:", error);
      }
      
      if (profile) {
        setProfile({ ...profile, online });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const logout = async () => {
    if (user) {
      // Set user offline before logging out
      await updateUserStatus(false);
    }

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      updateUserStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
