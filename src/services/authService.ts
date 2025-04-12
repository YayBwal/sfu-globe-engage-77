
import { supabase } from '@/integrations/supabase/client';

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
    
    // Step 1: Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          student_id: studentId,
          major: major,
          batch: batch,
        },
      },
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

    // Step 2: Create a profile in the 'profiles' table
    const profileData = {
      id: data.user.id,
      name: name,
      student_id: studentId,
      major: major,
      batch: batch,
      email: email,
      student_id_photo: studentIdPhoto,
      approval_status: 'pending',
    };

    console.log("Creating profile with data:", profileData);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      
      // If profile creation fails, attempt to clean up the auth user to prevent orphaned accounts
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log("Cleaned up auth user due to profile creation failure");
      } catch (cleanupError) {
        console.error("Failed to clean up auth user after profile error:", cleanupError);
      }
      
      throw profileError;
    }

    console.log("Profile created successfully");
    return data.user;

  } catch (error: any) {
    console.error("Registration failed:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting login for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error);
      throw error;
    }

    if (!data.user) {
      throw new Error("No user returned from login");
    }

    console.log("Login successful, fetching profile");

    // Fetch the user's profile to check approval status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw profileError;
    }

    if (!profileData) {
      console.error("Profile not found for user:", data.user.id);
      throw new Error('User profile not found');
    }

    if (profileData.approval_status !== 'approved') {
      console.log("Account not approved:", profileData.approval_status);
      // Log the user out if their account is not approved
      await supabase.auth.signOut();
      throw new Error('Your account has not been approved yet.');
    }

    return data.user;
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
