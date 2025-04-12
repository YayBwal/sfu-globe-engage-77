
import { supabase } from '@/integrations/supabase/client';

/**
 * Register a new user with Supabase
 */
export const registerUser = async (
  email: string, 
  password: string, 
  name: string, 
  studentId: string, 
  major: string, 
  batch: string,
  studentIdPhoto?: string
) => {
  // Register the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Registration failed');
  }

  // Create a profile record in the profiles table
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    name,
    student_id: studentId,
    major,
    batch,
    student_id_photo: studentIdPhoto,
    approval_status: 'pending', // New users need approval
    online: false,
    created_at: new Date().toISOString(), // Convert Date to string
  });

  if (profileError) {
    // If profile creation fails, we should clean up the auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  return authData;
};

/**
 * Login a user with Supabase
 */
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Login failed');
  }

  // Check if user is approved
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('approval_status')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    throw new Error(`Error fetching profile: ${profileError.message}`);
  }

  if (profileData.approval_status !== 'approved') {
    // Sign out the user if they're not approved
    await supabase.auth.signOut();
    throw new Error('Your account is pending approval by an administrator');
  }

  return data;
};

/**
 * Logout a user from Supabase
 */
export const logoutUser = async () => {
  // Update online status before logging out
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    await supabase.from('profiles').update({ online: false }).eq('id', user.id);
  }
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw new Error(error.message);
  }
};
