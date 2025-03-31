
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
  try {
    console.log("Starting registration process for:", email, studentId);
    
    // First check if the student ID already exists in the profiles table
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('student_id')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking for existing profile:", checkError);
      throw new Error('Error checking for existing student ID. Please try again.');
    }
    
    if (existingProfile) {
      console.log("Student ID already exists:", studentId);
      throw new Error('A user with this Student ID already exists. Please use a different Student ID or contact support.');
    }

    // Check if the email already exists by trying to get user data
    const { data: existingUsers, error: emailCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
      
    if (emailCheckError) {
      console.error("Error checking for existing email:", emailCheckError);
    }
    
    if (existingUsers) {
      console.log("Email already exists:", email);
      throw new Error('A user with this email already exists. Please use a different email or try logging in.');
    }
    
    console.log("Checks passed, proceeding with registration");
    
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
      console.error("Auth signup error:", error);
      throw error;
    }
    
    console.log("Registration successful");
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Convert database constraint errors to user-friendly messages
    if (error.message && error.message.includes('duplicate key')) {
      if (error.message.includes('profiles_student_id_key')) {
        throw new Error('This Student ID is already registered. Please use a different Student ID or contact support.');
      } else if (error.message.includes('profiles_email_key')) {
        throw new Error('This email address is already registered. Please use a different email or try logging in.');
      } else {
        throw new Error('A user with this Student ID or email already exists. Please try a different one or contact support.');
      }
    }
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<void> => {
  // Special case for the admin user with ID 2024D5764
  if (email === '2024D5764' || email === 'Yan Naing Aung') {
    // Get the actual email for this admin user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('student_id', '2024D5764')
      .single();
    
    if (!profileError && profileData && profileData.email) {
      // If found, use the email to login
      email = profileData.email;
    }
    
    // Also update admin status in the database if needed
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('admin_id', '2024D5764')
      .single();
      
    if (!adminData) {
      // Ensure this user is in the admins table
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', '2024D5764')
        .single();
        
      if (userData) {
        await supabase
          .from('admins')
          .upsert({ id: userData.id, admin_id: '2024D5764' });
      }
    }
  }

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
    
    // For admin users, we'll skip the approval check
    const { data: adminData } = await supabase.rpc('is_admin');
    if (adminData === true) {
      return; // Admin users can always log in
    }
    
    // Check approval status for non-admin users
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
      .select('email, approval_status, id')
      .eq('student_id', email)
      .single();
    
    if (error) {
      throw new Error('Student ID not found');
    }
    
    if (!data || !data.email) {
      throw new Error('No email associated with this Student ID');
    }
    
    // Check if user is an admin
    const isAdmin = await supabase
      .from('admins')
      .select('id')
      .eq('id', data.id)
      .single();
      
    // If user is not an admin, check approval status
    if (!isAdmin.data && data.approval_status !== 'approved') {
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

export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error("Password reset error:", error);
    throw error;
  }
};
