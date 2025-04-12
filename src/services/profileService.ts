import { supabase } from '@/integrations/supabase/client';
import { UserProfile, NotificationPreferences, PrivacySettings } from '@/types/auth';

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log("Fetching profile for user:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    if (!data) {
      console.log("No profile found for user:", userId);
      return null;
    }

    // Map database fields to our UserProfile type
    const mappedProfile: UserProfile = {
      id: data.id,
      name: data.name,
      student_id: data.student_id,
      major: data.major,
      batch: data.batch,
      email: data.email,
      online: Boolean(data.online),
      bio: data.bio || "",
      interests: data.interests || [],
      availability: data.availability || "",
      profilePic: data.profile_pic,
      coverPic: data.cover_pic,
      student_id_photo: data.student_id_photo,
      approval_status: data.approval_status || 'pending',
      phone: data.phone,
      // Convert JSON to proper TypeScript objects
      notificationPreferences: data.notification_preferences ? 
        data.notification_preferences as NotificationPreferences : undefined,
      privacySettings: data.privacy_settings ? 
        data.privacy_settings as PrivacySettings : undefined,
      // Keep original DB fields for compatibility
      profile_pic: data.profile_pic,
      cover_pic: data.cover_pic,
      theme_preference: data.theme_preference,
    };
    
    console.log("Profile fetched successfully:", mappedProfile.name);
    return mappedProfile;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    console.log("Updating profile for user:", userId, "with updates:", updates);
    
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

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
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
        online: Boolean(data.online),
        bio: data.bio || "",
        interests: data.interests || [],
        availability: data.availability || "",
        profilePic: data.profile_pic,
        coverPic: data.cover_pic,
        student_id_photo: data.student_id_photo,
        approval_status: data.approval_status || 'pending',
        phone: data.phone,
        // Convert JSON to proper TypeScript objects
        notificationPreferences: data.notification_preferences ? 
          data.notification_preferences as NotificationPreferences : undefined,
        privacySettings: data.privacy_settings ?
          data.privacy_settings as PrivacySettings : undefined,
        profile_pic: data.profile_pic,
        cover_pic: data.cover_pic,
        theme_preference: data.theme_preference,
      };
      
      console.log("Profile updated successfully for:", updatedProfile.name);
      return updatedProfile;
    }
    
    console.log("No data returned from profile update");
    return null;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
};

export const checkUserExists = async (studentId: string, email: string): Promise<boolean> => {
  try {
    console.log("Checking if user exists with student ID:", studentId, "or email:", email);
    
    // Check if a profile with the same student ID or email already exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking if user exists:", error);
      throw error;
    }
    
    const exists = !!data;
    console.log("User exists:", exists);
    return exists;
  } catch (error) {
    console.error("Error in checkUserExists:", error);
    return false;
  }
};
