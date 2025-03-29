
import { supabase } from '@/integrations/supabase/client';

export const registerUser = async (
  email: string, 
  password: string, 
  name: string, 
  studentId: string, 
  major: string, 
  batch: string,
  studentIdPhoto?: string
): Promise<void> => {
  // First check if the student ID already exists in the profiles table
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('student_id')
    .eq('student_id', studentId)
    .single();
  
  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is the error code for "no rows returned" which is what we want
    throw checkError;
  }
  
  if (existingProfile) {
    throw new Error('A user with this Student ID already exists. Please use a different Student ID or contact support.');
  }

  // Then check if the email already exists
  const { data: existingAuth, error: emailCheckError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false
    }
  });

  // If authentication attempt doesn't error with "user not found", the email exists
  if (existingAuth?.user) {
    throw new Error('A user with this email already exists. Please use a different email or try logging in.');
  }
  
  // Now proceed with registration since both checks passed
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        student_id: studentId,
        major,
        batch,
        student_id_photo: studentIdPhoto,
        approval_status: 'pending'
      }
    }
  });

  if (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<void> => {
  // Check if the input is an email or student ID
  const isEmail = email.includes('@');
  
  if (isEmail) {
    // Login with email and password directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    
    // Check approval status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('email', email)
      .single();
    
    if (profileError) {
      throw new Error('Error verifying account status');
    }
    
    if (profileData && profileData.approval_status !== 'approved') {
      // Log them out if not approved
      await supabase.auth.signOut();
      throw new Error('Your account is pending approval. Please check back later.');
    }
  } else {
    // If it's a student ID, we need to find the corresponding email first
    const { data, error } = await supabase
      .from('profiles')
      .select('email, approval_status')
      .eq('student_id', email)
      .single();
    
    if (error) {
      throw new Error('Student ID not found');
    }
    
    if (!data || !data.email) {
      throw new Error('No email associated with this Student ID');
    }
    
    // Check approval status
    if (data.approval_status !== 'approved') {
      throw new Error('Your account is pending approval. Please check back later.');
    }
    
    // Now login with the found email and provided password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password,
    });

    if (authError) {
      throw authError;
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};
