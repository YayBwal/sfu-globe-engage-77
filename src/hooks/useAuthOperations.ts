import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export function useAuthOperations() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
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
          role: profileData.role || "student",
          // Keep original DB fields for compatibility
          profile_pic: profileData.profile_pic,
          cover_pic: profileData.cover_pic
        };
        
        return mappedProfile;
      }

      return null;
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      return null;
    }
  };

  const updateAuthState = async (currentUser: any) => {
    setLoading(true);
    try {
      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        
        if (userProfile) {
          setProfile(userProfile);
          setIsAuthenticated(true);
          setIsTeacher(userProfile.role === 'teacher');
        } else {
          setProfile(null);
          setIsAuthenticated(false);
          setIsTeacher(false);
        }
      } else {
        setProfile(null);
        setIsAuthenticated(false);
        setIsTeacher(false);
      }
    } catch (error) {
      console.error("Error updating auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    studentId: string, 
    major: string, 
    batch: string
  ) => {
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

      // After successful registration, navigate to profile setup
      navigate('/profile');
    } catch (error: any) {
      console.error("Registration failed:", error.message);
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
          role: data.role || "student",
          profile_pic: data.profile_pic,
          cover_pic: data.cover_pic
        };
        
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      console.error("Profile update failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    setUser,
    profile,
    loading,
    isAuthenticated,
    isTeacher,
    updateAuthState,
    register,
    login,
    logout,
    updateProfile
  };
}
