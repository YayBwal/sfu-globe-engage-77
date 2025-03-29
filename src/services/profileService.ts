import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    if (data) {
      // Map database fields to our UserProfile type
      const mappedProfile: UserProfile = {
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
        student_id_photo: data.student_id_photo,
        approval_status: data.approval_status || 'pending',
        // Keep original DB fields for compatibility
        profile_pic: data.profile_pic,
        cover_pic: data.cover_pic
      };
      
      return mappedProfile;
    }
    
    return null;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
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
      .eq('id', userId)
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
        student_id_photo: data.student_id_photo,
        approval_status: data.approval_status || 'pending',
        profile_pic: data.profile_pic,
        cover_pic: data.cover_pic
      };
      
      return updatedProfile;
    }
    
    return null;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
};
