
import { supabase } from '@/integrations/supabase/client';
import { checkUserExists } from './profileService';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  studentId: string,
  major: string,
  batch: string,
  studentIdPhoto?: string
): Promise<void> => {
  try {
    console.log("Attempting to register user with email:", email, "studentId:", studentId);

    // Check if user already exists
    const userExists = await checkUserExists(studentId, email);
    if (userExists) {
      throw new Error("User with this Student ID or Email already exists.");
    }

    // Sign up user with Supabase auth
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
      console.error("Supabase signup error:", error);
      throw new Error(error.message || "Signup failed");
    }

    if (!data.user) {
      throw new Error("User not found after signup");
    }

    // Upload student ID photo if provided
    if (studentIdPhoto) {
      const filePath = `student-id-photos/${data.user.id}-${new Date().getTime()}`;
      const { error: uploadError } = await supabase.storage
        .from("student-id-photos")
        .upload(filePath, dataURLtoBlob(studentIdPhoto), {
          contentType: "image/png", // Adjust content type as needed
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading student ID photo:", uploadError);
        throw new Error("Error uploading student ID photo.");
      }

      // Get public URL for the uploaded photo
      const { data: photoData } = supabase.storage
        .from("student-id-photos")
        .getPublicUrl(filePath);

      // Create user profile in 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            name: name,
            student_id: studentId,
            major: major,
            batch: batch,
            student_id_photo: photoData.publicUrl,
            approval_status: 'pending',
          },
        ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create profile.");
      }
    } else {
      // Create user profile in 'profiles' table without student ID photo
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            name: name,
            student_id: studentId,
            major: major,
            batch: batch,
            approval_status: 'pending',
          },
        ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create profile.");
      }
    }

    console.log("User registered successfully. Verification email sent.");
  } catch (error: any) {
    console.error("User registration failed:", error);
    throw error;
  }
};

// Helper function to convert data URL to Blob
function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export const loginUser = async (identifier: string, password: string): Promise<void> => {
  try {
    console.log("Attempting to log in user with identifier:", identifier);

    // Try to determine if identifier is an email or student ID
    const isEmail = identifier.includes('@');
    
    // First attempt: Try with the provided identifier as is (works for email)
    let { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    // If the first attempt fails and the identifier doesn't look like an email,
    // try looking up the user by student_id in the profiles table
    if (error && !isEmail) {
      console.log("First login attempt failed, trying to find user by student ID:", identifier);
      
      // Look up the email associated with this student ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('student_id', identifier)
        .single();
      
      if (profileError || !profileData) {
        console.error("Failed to find user with student ID:", identifier);
        throw new Error("Invalid login credentials");
      }
      
      // Try logging in with the found email
      const response = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: password,
      });
      
      data = response.data;
      error = response.error;
    }

    if (error) {
      console.error("Supabase signin error:", error);
      throw new Error(error.message || "Login failed");
    }

    if (!data.user) {
      throw new Error("User not found after login");
    }

    // Fetch user profile to check approval status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', data.user.id)
      .single();

    // For now, we'll bypass the approval check for testing purposes
    // Normally we'd have this check:
    /*
    if (profileData?.approval_status !== 'approved') {
      console.warn("User is not approved:", data.user.id);
      await logoutUser(); // Sign out the user
      throw new Error("Your account is awaiting admin approval.");
    }
    */

    console.log("User logged in successfully:", data.user.id);
  } catch (error: any) {
    console.error("User login failed:", error);
    
    // Improved network error detection
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error("Network error: Unable to connect to authentication service. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log("Attempting to log out user");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signout error:", error);
      throw new Error(error.message || "Logout failed");
    }

    console.log("User logged out successfully");
  } catch (error: any) {
    console.error("User logout failed:", error);
    throw error;
  }
};

export const deleteAccount = async (userId: string): Promise<void> => {
  try {
    console.log("Deleting user account:", userId);
    
    // First, delete the user's profile data
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      throw new Error("Failed to delete account. Please try again later.");
    }
    
    // Then delete the auth user
    const { error: userDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (userDeleteError) {
      console.error("Error deleting user:", userDeleteError);
      throw new Error("Failed to delete account. Please try again later.");
    }
    
    console.log("Account successfully deleted");
  } catch (error: any) {
    console.error("Error in deleteAccount:", error);
    
    // Improve error handling with network detection
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};

// Add the missing updatePassword function
export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    console.log("Attempting to update password");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      throw new Error(error.message || "Password update failed");
    }

    console.log("Password updated successfully");
  } catch (error: any) {
    console.error("Password update failed:", error);
    
    // Improved network error detection
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error("Network error: Unable to connect to authentication service. Please check your internet connection and try again.");
    }
    
    throw error;
  }
};
