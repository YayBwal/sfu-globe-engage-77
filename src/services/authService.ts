
import { supabase } from '@/integrations/supabase/client';

export const registerUser = async (
  email: string, 
  password: string, 
  name: string, 
  studentId: string, 
  major: string, 
  batch: string
): Promise<void> => {
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
  } else {
    // If it's a student ID, we need to find the corresponding email first
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('student_id', email)
      .single();
    
    if (error) {
      throw new Error('Student ID not found');
    }
    
    if (!data || !data.email) {
      throw new Error('No email associated with this Student ID');
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
