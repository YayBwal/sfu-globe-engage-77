import { supabase } from '@/integrations/supabase/client';

export const deleteAccount = async (userId: string) => {
  try {
    // Soft delete by updating the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ approval_status: 'deleted' })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Optional: Delete user's auth account 
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

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
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          student_id: studentId,
          major: major,
          batch: batch,
          student_id_photo: studentIdPhoto,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Create a user profile in the 'profiles' table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user?.id,
          name: name,
          student_id: studentId,
          major: major,
          batch: batch,
          email: email,
        },
      ]);

    if (profileError) {
      throw profileError;
    }
  } catch (error: any) {
    console.error("Registration failed:", error.message);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    // Fetch the user's profile to check approval status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', data.user?.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profileData && profileData.approval_status !== 'approved') {
      // Log the user out if their account is not approved
      await supabase.auth.signOut();
      throw new Error('Your account has not been approved yet.');
    }
  } catch (error: any) {
    console.error("Login failed:", error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error("Logout failed:", error.message);
    throw error;
  }
};
