
import { supabase } from '@/integrations/supabase/client';
import { TypedSupabaseClient } from '@/types/supabaseCustom';
import { toast } from '@/hooks/use-toast';

const typedSupabase = supabase as unknown as TypedSupabaseClient;

export const deleteAccount = async (userId: string) => {
  try {
    console.log("Attempting to delete account for user ID:", userId);
    
    // Soft delete by updating the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ approval_status: 'deleted' })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile for deletion:", profileError);
      throw profileError;
    }

    // Optional: Delete user's auth account 
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw authError;
    }

    console.log("Successfully deleted account for user ID:", userId);
    return true;
  } catch (error) {
    console.error("Account deletion error:", error);
    throw error;
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  studentId: string,
  major: string,
  batch: string,
  studentIdPhoto?: string
) => {
  try {
    console.log("Starting registration process with:", { email, name, studentId, major, batch });
    
    // First check if a profile with this student ID or email already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking if user exists:", checkError);
      // Continue with registration instead of throwing error - profiles might not exist yet
    } else if (existingProfile) {
      throw new Error("A user with this student ID or email already exists");
    }
    
    // Step 1: Create the user in Supabase Auth with proper email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          studentId,
          major,
          batch,
          studentIdPhoto
        }
      }
    });

    if (error) {
      console.error("Auth signup error:", error);
      throw error;
    }

    if (!data.user) {
      console.error("No user returned from signup");
      throw new Error("Failed to create user account");
    }

    console.log("Auth signup successful, user ID:", data.user.id);

    // Important: With the trigger function in place, the profile will be created automatically
    // We don't need to manually create a profile, but we'll wait a moment to ensure it's created
    // Then return the user

    // Optional: Wait a moment and verify profile was created
    setTimeout(async () => {
      try {
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user!.id)
          .maybeSingle();
          
        if (!profileCheck) {
          console.log("Profile not created automatically by trigger, creating manually");
          
          // Fallback: Create profile manually if trigger failed
          const profileData = {
            id: data.user!.id,
            name,
            student_id: studentId,
            major,
            batch,
            email,
            student_id_photo: studentIdPhoto,
            approval_status: 'pending',
            bio: '',
            online: false,
            interests: [],
            availability: ''
          };
          
          await supabase.from('profiles').insert([profileData]);
        }
      } catch (verifyError) {
        console.error("Error verifying profile creation:", verifyError);
      }
    }, 1000);

    console.log("Registration process completed successfully");
    return data.user;

  } catch (error: any) {
    console.error("Registration failed:", error);
    throw error;
  }
};

export const loginUser = async (identifier: string, password: string) => {
  try {
    console.log("Attempting login with identifier:", identifier);
    
    // Clean up the identifier (remove whitespace)
    const cleanIdentifier = identifier.trim();
    
    // Check if the identifier is an email (contains @ symbol)
    const isEmail = cleanIdentifier.includes('@');
    
    let user;
    
    try {
      if (isEmail) {
        // Login with email directly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password: password,
        });

        if (error) {
          console.error("Login with email error:", error);
          throw error;
        }

        if (!data.user) {
          throw new Error("No user returned from login");
        }
        
        user = data.user;
      } else {
        // Login with student ID - first find the email associated with this student ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('student_id', cleanIdentifier)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profileData || !profileData.email) {
          throw new Error("No user found with this Student ID");
        }

        // Now login with the retrieved email
        const { data, error } = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: password,
        });

        if (error) {
          console.error("Login error after student ID lookup:", error);
          throw error;
        }

        if (!data.user) {
          throw new Error("No user returned from login");
        }
        
        user = data.user;
      }

      console.log("Login successful, fetching profile");

      // Fetch the user's profile to check approval status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("Profile not found for user:", user.id);
        throw new Error('User profile not found');
      }

      // For now, skip the approval check to allow admin logins without confirmation
      // if (profileData.approval_status !== 'approved') {
      //   console.log("Account not approved:", profileData.approval_status);
      //   // Log the user out if their account is not approved
      //   await supabase.auth.signOut();
      //   throw new Error('Your account has not been approved yet.');
      // }

      return user;
    } catch (fetchError) {
      // Network error or Supabase connection issue
      console.error("Login process failed:", fetchError);
      
      // Enhanced error handling for network issues
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Login process failed:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log("Logging out user");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      throw error;
    }
    return true;
  } catch (error: any) {
    console.error("Logout failed:", error.message);
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Password update failed:", error.message);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      console.error("Password reset request error:", error);
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Password reset request failed:", error.message);
    throw error;
  }
};
