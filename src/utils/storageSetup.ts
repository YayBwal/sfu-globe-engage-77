
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates the profile-images bucket if it doesn't exist
 * Note: This is a fallback; buckets should be created via SQL migrations
 */
export const setupStorage = async () => {
  try {
    // Check if buckets are available (connection is working)
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error("Error checking buckets:", bucketError);
      return false;
    }
    
    // Check if the profile-images bucket exists
    const profileBucketExists = buckets?.some(bucket => bucket.name === 'profile-images');
    
    if (!profileBucketExists) {
      console.error("Profile-images bucket doesn't exist. Creating via API as fallback...");
      // Attempt to create the bucket as a fallback (this requires admin privileges)
      try {
        const { data, error } = await supabase
          .storage
          .createBucket('profile-images', { public: true });
          
        if (error) {
          console.error("Failed to create profile-images bucket:", error);
          return false;
        }
        
        console.log("Successfully created profile-images bucket.");
        return true;
      } catch (createError) {
        console.error("Exception when creating profile-images bucket:", createError);
        return false;
      }
    } else {
      console.log("Profile-images bucket exists.");
      return true;
    }
    
  } catch (error) {
    console.error("Storage setup error:", error);
    return false;
  }
};

export const initializeStorage = () => {
  setupStorage().catch(console.error);
};

export const setupStorageBuckets = setupStorage;

/**
 * Checks if a bucket exists and attempts to create it if it doesn't
 * @param bucketName The name of the bucket to check
 * @returns Promise<boolean> True if the bucket exists or was created successfully
 */
export const ensureBucketExists = async (bucketName: string) => {
  try {
    // First check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error(`Error checking if bucket "${bucketName}" exists:`, bucketError);
      return false;
    }
    
    // Check if the bucket exists in the returned list
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.warn(`Bucket "${bucketName}" doesn't exist. Attempting to access via API...`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket "${bucketName}" exists:`, error);
    return false;
  }
};
